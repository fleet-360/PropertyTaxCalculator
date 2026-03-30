import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const mockGet = vi.hoisted(() => vi.fn());

vi.mock('@vercel/blob', () => ({
  get: (...args: unknown[]) => mockGet(...args),
}));

import {
  fetchVercelBlobOrdinance,
  isVercelBlobPublicUrl,
} from '@/lib/ordinancePdf';

describe('isVercelBlobPublicUrl', () => {
  it('returns true for *.public.blob.vercel-storage.com', () => {
    expect(
      isVercelBlobPublicUrl(
        'https://abcd1234.public.blob.vercel-storage.com/path/doc.pdf',
      ),
    ).toBe(true);
  });

  it('returns true for *.private.blob.vercel-storage.com', () => {
    expect(
      isVercelBlobPublicUrl(
        'https://store.private.blob.vercel-storage.com/folder/doc.pdf',
      ),
    ).toBe(true);
  });

  it('returns false for relative paths', () => {
    expect(isVercelBlobPublicUrl('/ordinances/x.pdf')).toBe(false);
  });

  it('returns false for other HTTPS hosts', () => {
    expect(isVercelBlobPublicUrl('https://example.com/a.pdf')).toBe(false);
  });
});

describe('fetchVercelBlobOrdinance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('BLOB_READ_WRITE_TOKEN', 'secret-token');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('returns null for non-blob URLs', async () => {
    await expect(fetchVercelBlobOrdinance('https://example.com/a.pdf')).resolves.toBe(
      null,
    );
    expect(mockGet).not.toHaveBeenCalled();
  });

  it('calls get with access private and returns stream metadata', async () => {
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(new Uint8Array([1, 2]));
        controller.close();
      },
    });
    mockGet.mockResolvedValue({
      statusCode: 200,
      stream,
      headers: new Headers(),
      blob: {
        url: 'https://x.public.blob.vercel-storage.com/a.pdf',
        downloadUrl: 'https://x.public.blob.vercel-storage.com/a.pdf?download=1',
        pathname: 'a.pdf',
        contentDisposition: '',
        cacheControl: '',
        uploadedAt: new Date(),
        etag: '1',
        contentType: 'application/pdf',
        size: 2,
      },
    });

    const out = await fetchVercelBlobOrdinance(
      'https://x.public.blob.vercel-storage.com/a.pdf',
    );
    expect(out).not.toBeNull();
    expect(out!.contentType).toBe('application/pdf');
    expect(out!.size).toBe(2);
    expect(mockGet).toHaveBeenCalledWith(
      'https://x.public.blob.vercel-storage.com/a.pdf',
      { access: 'private' },
    );
  });

  it('returns null when get returns null', async () => {
    mockGet.mockResolvedValue(null);
    await expect(
      fetchVercelBlobOrdinance('https://x.public.blob.vercel-storage.com/missing.pdf'),
    ).resolves.toBe(null);
  });
});
