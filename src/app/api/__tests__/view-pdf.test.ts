import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

const mockGet = vi.hoisted(() => vi.fn());

vi.mock('@vercel/blob', () => ({
  get: (...args: unknown[]) => mockGet(...args),
}));

const { mockLeanById, mockLeanOne } = vi.hoisted(() => ({
  mockLeanById: vi.fn<() => Promise<unknown>>(),
  mockLeanOne: vi.fn<() => Promise<unknown>>(),
}));

vi.mock('@/lib/mongodb', () => ({
  default: vi.fn(() => Promise.resolve()),
}));

vi.mock('@/lib/models/CityTariff', () => ({
  default: {
    findById: vi.fn(() => ({
      select: vi.fn(() => ({ lean: () => mockLeanById() })),
    })),
    findOne: vi.fn(() => ({
      select: vi.fn(() => ({ lean: () => mockLeanOne() })),
    })),
  },
}));

import { GET } from '../view-pdf/[id]/route';

function mockBlobGetResponse(body: Uint8Array) {
  return {
    statusCode: 200 as const,
    stream: new ReadableStream({
      start(controller) {
        controller.enqueue(body);
        controller.close();
      },
    }),
    headers: new Headers(),
    blob: {
      url: 'https://abc.public.blob.vercel-storage.com/ord.pdf',
      downloadUrl: 'https://abc.public.blob.vercel-storage.com/ord.pdf?download=1',
      pathname: 'ord.pdf',
      contentDisposition: '',
      cacheControl: '',
      uploadedAt: new Date(),
      etag: 'e',
      contentType: 'application/pdf',
      size: body.length,
    },
  };
}

describe('GET /api/view-pdf/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLeanById.mockResolvedValue(null);
    vi.stubEnv('BLOB_READ_WRITE_TOKEN', 'test-blob-token');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('returns 404 when city has no ordinanceUrl', async () => {
    mockLeanOne.mockResolvedValue({ ordinanceUrl: '' });
    const req = new NextRequest('http://localhost/api/view-pdf/mock-city');
    const res = await GET(req, {
      params: Promise.resolve({ id: 'mock-city' }),
    });
    expect(res.status).toBe(404);
  });

  it('streams blob PDF with inline Content-Disposition via @vercel/blob get', async () => {
    mockLeanOne.mockResolvedValue({
      ordinanceUrl: 'https://abc.public.blob.vercel-storage.com/ord.pdf',
    });

    const bytes = new Uint8Array([0x25, 0x50, 0x44, 0x46]);
    mockGet.mockResolvedValue(mockBlobGetResponse(bytes));

    const req = new NextRequest('http://localhost/api/view-pdf/my-city');
    const res = await GET(req, {
      params: Promise.resolve({ id: 'my-city' }),
    });

    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('application/pdf');
    expect(res.headers.get('Content-Disposition')).toContain('inline');
    expect(res.headers.get('Content-Disposition')).toContain('ord.pdf');
    expect(mockGet).toHaveBeenCalledWith(
      'https://abc.public.blob.vercel-storage.com/ord.pdf',
      { access: 'private' },
    );
  });

  it('uses attachment when download=1', async () => {
    mockLeanOne.mockResolvedValue({
      ordinanceUrl: 'https://abc.public.blob.vercel-storage.com/ord.pdf',
    });

    mockGet.mockResolvedValue(mockBlobGetResponse(new Uint8Array([1])));

    const req = new NextRequest(
      'http://localhost/api/view-pdf/my-city?download=1',
    );
    const res = await GET(req, {
      params: Promise.resolve({ id: 'my-city' }),
    });

    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Disposition')).toContain('attachment');
  });

  it('redirects relative ordinance URL when not downloading', async () => {
    mockLeanOne.mockResolvedValue({
      ordinanceUrl: '/ordinances/mock-city-2026.pdf',
    });

    const req = new NextRequest('http://localhost/api/view-pdf/mock-city');
    const res = await GET(req, {
      params: Promise.resolve({ id: 'mock-city' }),
    });

    expect(res.status).toBe(307);
    expect(res.headers.get('Location')).toBe(
      'http://localhost/ordinances/mock-city-2026.pdf',
    );
  });
});
