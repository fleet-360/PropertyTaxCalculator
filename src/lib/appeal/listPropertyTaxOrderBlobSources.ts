import { list } from '@vercel/blob';
import type { BlobBackedGeminiSource } from '@/lib/gemini/resolveBlobToGeminiFile';
import { BLOB_PROPERTY_TAX_ORDERS_LIST_PREFIX } from '@/lib/services/blobUploadService';

const GEMINI_ORDER_MIME_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
]);

function guessMimeTypeFromPathname(pathname: string): string {
  const base = pathname.split('/').pop() ?? pathname;
  const ext = base.includes('.') ? base.split('.').pop()?.toLowerCase() ?? '' : '';
  const map: Record<string, string> = {
    pdf: 'application/pdf',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    webp: 'image/webp',
    heic: 'image/heic',
    heif: 'image/heif',
  };
  return map[ext] ?? 'application/octet-stream';
}

/**
 * Lists blobs under the admin “Property tax orders/” folder (city-specific ordinances).
 * Skips extensions that are not PDF / image so generation does not fail on unsupported types.
 * Requires `BLOB_READ_WRITE_TOKEN`; returns [] if missing.
 */
export async function listPropertyTaxOrderBlobSources(): Promise<BlobBackedGeminiSource[]> {
  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  if (!token) {
    return [];
  }

  const prefix = BLOB_PROPERTY_TAX_ORDERS_LIST_PREFIX;
  const out: BlobBackedGeminiSource[] = [];
  let cursor: string | undefined;

  do {
    const page = await list({
      prefix,
      token,
      cursor,
      limit: 1000,
    });

    for (const b of page.blobs) {
      if (!b.pathname.startsWith(prefix)) continue;
      const relative = b.pathname.slice(prefix.length);
      if (!relative || relative.endsWith('/')) continue;

      const mimeType = guessMimeTypeFromPathname(b.pathname);
      if (!GEMINI_ORDER_MIME_TYPES.has(mimeType)) continue;

      out.push({
        displayName: `blob-order:${b.pathname}`,
        blobUrl: b.url,
        mimeType,
      });
    }

    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);

  return out;
}

