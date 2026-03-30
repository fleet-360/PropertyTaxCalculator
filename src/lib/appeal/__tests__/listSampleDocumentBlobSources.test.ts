import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { listSampleDocumentBlobSources } from '@/lib/appeal/listSampleDocumentBlobSources';

vi.mock('@vercel/blob', () => ({
  list: vi.fn(),
}));

import { list } from '@vercel/blob';

describe('listSampleDocumentBlobSources', () => {
  const listMock = vi.mocked(list);

  beforeEach(() => {
    vi.stubEnv('BLOB_READ_WRITE_TOKEN', 'test-token');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    listMock.mockReset();
  });

  it('returns [] when BLOB_READ_WRITE_TOKEN is missing', async () => {
    vi.unstubAllEnvs();
    vi.stubEnv('BLOB_READ_WRITE_TOKEN', '');
    const out = await listSampleDocumentBlobSources();
    expect(out).toEqual([]);
    expect(listMock).not.toHaveBeenCalled();
  });

  it('maps PDF and image blobs under Sample documents/', async () => {
    listMock.mockResolvedValueOnce({
      blobs: [
        {
          url: 'https://x.blob/a.pdf',
          pathname: 'Sample documents/a.pdf',
          downloadUrl: 'https://x.blob/a.pdf?d=1',
          size: 100,
          uploadedAt: new Date(),
          etag: '1',
        },
        {
          url: 'https://x.blob/b.jpg',
          pathname: 'Sample documents/b.jpg',
          downloadUrl: 'https://x.blob/b.jpg?d=1',
          size: 50,
          uploadedAt: new Date(),
          etag: '2',
        },
        {
          url: 'https://x.blob/ignore.doc',
          pathname: 'Sample documents/ignore.doc',
          downloadUrl: 'https://x.blob/ignore.doc?d=1',
          size: 10,
          uploadedAt: new Date(),
          etag: '3',
        },
      ],
      hasMore: false,
    });

    const out = await listSampleDocumentBlobSources();
    expect(out).toHaveLength(2);
    expect(out[0]).toMatchObject({
      blobUrl: 'https://x.blob/a.pdf',
      mimeType: 'application/pdf',
      displayName: 'blob-sample:Sample documents/a.pdf',
    });
    expect(out[1]).toMatchObject({
      blobUrl: 'https://x.blob/b.jpg',
      mimeType: 'image/jpeg',
    });
    expect(listMock).toHaveBeenCalledWith(
      expect.objectContaining({ prefix: 'Sample documents/', token: 'test-token' }),
    );
  });

  it('paginates with cursor', async () => {
    listMock
      .mockResolvedValueOnce({
        blobs: [
          {
            url: 'https://x.blob/1.pdf',
            pathname: 'Sample documents/1.pdf',
            downloadUrl: '',
            size: 1,
            uploadedAt: new Date(),
            etag: '',
          },
        ],
        hasMore: true,
        cursor: 'next',
      })
      .mockResolvedValueOnce({
        blobs: [
          {
            url: 'https://x.blob/2.pdf',
            pathname: 'Sample documents/2.pdf',
            downloadUrl: '',
            size: 1,
            uploadedAt: new Date(),
            etag: '',
          },
        ],
        hasMore: false,
      });

    const out = await listSampleDocumentBlobSources();
    expect(out).toHaveLength(2);
    expect(listMock).toHaveBeenCalledTimes(2);
    expect(listMock.mock.calls[1][0]).toMatchObject({ cursor: 'next' });
  });
});
