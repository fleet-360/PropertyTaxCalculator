import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FileState } from '@google/generative-ai/server';
import {
  ensureGeminiFileUri,
  findFileByDisplayName,
  resetGeminiFileManagerForTests,
} from '@/lib/gemini/resolveBlobToGeminiFile';

function meta(partial: Record<string, unknown>) {
  return {
    mimeType: 'application/pdf',
    sizeBytes: '100',
    createTime: '2020-01-01T00:00:00Z',
    updateTime: '2020-01-01T00:00:00Z',
    expirationTime: '2099-01-01T00:00:00Z',
    sha256Hash: 'abc',
    ...partial,
  };
}

describe('findFileByDisplayName', () => {
  it('paginates until match', async () => {
    const listFiles = vi
      .fn()
      .mockResolvedValueOnce({
        files: [{ displayName: 'other', name: 'files/a' }],
        nextPageToken: 't1',
      })
      .mockResolvedValueOnce({
        files: [
          meta({
            displayName: 'target',
            name: 'files/b',
            uri: 'https://generativelanguage.googleapis.com/v1beta/files/b',
            state: FileState.ACTIVE,
          }),
        ],
      });

    const fm = { listFiles } as any;
    const found = await findFileByDisplayName(fm, 'target');
    expect(found?.displayName).toBe('target');
    expect(listFiles).toHaveBeenCalledTimes(2);
  });
});

describe('ensureGeminiFileUri', () => {
  beforeEach(() => {
    resetGeminiFileManagerForTests();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        arrayBuffer: () => Promise.resolve(new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]).buffer),
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('reuses ACTIVE non-expired file by displayName', async () => {
    const uri = 'https://generativelanguage.googleapis.com/v1beta/files/existing';
    const listFiles = vi.fn().mockResolvedValue({
      files: [
        meta({
          displayName: 'doc-1',
          name: 'files/existing',
          uri,
          state: FileState.ACTIVE,
          expirationTime: '2099-01-01T00:00:00Z',
        }),
      ],
    });
    const uploadFile = vi.fn();
    const fm = { listFiles, uploadFile, getFile: vi.fn(), deleteFile: vi.fn() } as any;

    const out = await ensureGeminiFileUri(
      { displayName: 'doc-1', blobUrl: 'https://blob.example/x.pdf' },
      fm,
    );
    expect(out).toBe(uri);
    expect(uploadFile).not.toHaveBeenCalled();
  });

  it('uploads when no match', async () => {
    const listFiles = vi.fn().mockResolvedValue({ files: [] });
    const uploadFile = vi.fn().mockResolvedValue({
      file: meta({
        name: 'files/newid',
        state: FileState.PROCESSING,
        uri: 'https://generativelanguage.googleapis.com/v1beta/files/newid',
      }),
    });
    const getFile = vi
      .fn()
      .mockResolvedValueOnce(
        meta({
          name: 'files/newid',
          state: FileState.PROCESSING,
          uri: 'https://generativelanguage.googleapis.com/v1beta/files/newid',
        }),
      )
      .mockResolvedValueOnce(
        meta({
          name: 'files/newid',
          state: FileState.ACTIVE,
          uri: 'https://generativelanguage.googleapis.com/v1beta/files/newid',
          expirationTime: '2099-01-01T00:00:00Z',
        }),
      );
    const deleteFile = vi.fn();
    const fm = { listFiles, uploadFile, getFile, deleteFile } as any;

    const out = await ensureGeminiFileUri(
      { displayName: 'doc-2', blobUrl: 'https://blob.example/y.pdf' },
      fm,
      { pollIntervalMs: 5, pollMaxWaitMs: 500 },
    );
    expect(out).toContain('generativelanguage.googleapis.com');
    expect(uploadFile).toHaveBeenCalledTimes(1);
    expect(getFile.mock.calls.length).toBeGreaterThanOrEqual(1);
  });
});
