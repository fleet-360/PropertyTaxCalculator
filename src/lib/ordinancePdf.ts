/**
 * Ordinance PDF URLs may point at Vercel Blob (public or private store).
 * Server-side reads use `@vercel/blob` `get()` with `BLOB_READ_WRITE_TOKEN` (see Vercel Blob SDK).
 */

import { get } from '@vercel/blob';

const VERCEL_BLOB_HOST_SUFFIX = '.blob.vercel-storage.com';

export function isVercelBlobPublicUrl(url: string): boolean {
  const trimmed = url.trim();
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    return false;
  }
  try {
    const host = new URL(trimmed).hostname.toLowerCase();
    return host.endsWith(VERCEL_BLOB_HOST_SUFFIX);
  } catch {
    return false;
  }
}

/**
 * Fetches blob bytes via the Vercel Blob SDK (`get`), required for private blobs and consistent auth.
 * Returns `null` if the blob is missing or the URL is not a Vercel Blob store URL.
 */
export async function fetchVercelBlobOrdinance(ordinanceUrl: string): Promise<{
  stream: ReadableStream<Uint8Array>;
  contentType: string;
  size: number;
} | null> {
  if (!isVercelBlobPublicUrl(ordinanceUrl)) {
    return null;
  }
  const result = await get(ordinanceUrl, { access: 'private' });
  if (result === null || result.statusCode !== 200 || result.stream == null) {
    return null;
  }
  return {
    stream: result.stream,
    contentType: result.blob.contentType || 'application/pdf',
    size: result.blob.size ?? 0,
  };
}
