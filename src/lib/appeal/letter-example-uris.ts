import type { BlobBackedGeminiSource } from '@/lib/gemini/resolveBlobToGeminiFile';
import { listSampleDocumentBlobSources } from '@/lib/appeal/listSampleDocumentBlobSources';

/**
 * Direct Gemini File API URIs (optional). Paste after uploading via AI Studio / Files API.
 * Override via env APPEAL_LETTER_EXAMPLE_URIS=comma,separated,uris
 */
export const GEMINI_APPEAL_LETTER_EXAMPLE_FILE_URIS: string[] = [
  // 'https://generativelanguage.googleapis.com/v1beta/files/xxxxxxxx',
];

/**
 * Vercel Blob–backed examples: resolved lazily via Files API (list by displayName → else upload).
 * Add rows here or use APPEAL_LETTER_EXAMPLE_SOURCES_JSON (see below).
 */
export const APPEAL_LETTER_EXAMPLE_BLOB_SOURCES: BlobBackedGeminiSource[] = [
  // { displayName: 'appeal-example-01', blobUrl: 'https://....public.blob.vercel-storage.com/....pdf' },
];

export const APPEAL_EXAMPLE_PDF_MIME_TYPE = 'application/pdf' as const;

function parseEnvJsonBlobSources(): BlobBackedGeminiSource[] {
  const raw = process.env.APPEAL_LETTER_EXAMPLE_SOURCES_JSON?.trim();
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw) as unknown;
    if (!Array.isArray(arr)) return [];
    const out: BlobBackedGeminiSource[] = [];
    for (const item of arr) {
      if (item == null || typeof item !== 'object') continue;
      const o = item as Record<string, unknown>;
      const displayName = typeof o.displayName === 'string' ? o.displayName.trim() : '';
      const blobUrl = typeof o.blobUrl === 'string' ? o.blobUrl.trim() : '';
      if (!displayName || !blobUrl) continue;
      const mimeType = typeof o.mimeType === 'string' ? o.mimeType.trim() : undefined;
      out.push({ displayName, blobUrl, mimeType: mimeType || undefined });
    }
    return out;
  } catch {
    return [];
  }
}

/** URIs used as-is in `fileData` (no Blob download / upload). */
export function getDirectAppealLetterExampleUris(): string[] {
  const raw = process.env.APPEAL_LETTER_EXAMPLE_URIS?.trim();
  const fromEnv = raw
    ? raw
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    : [];
  const fromConst = GEMINI_APPEAL_LETTER_EXAMPLE_FILE_URIS.filter(Boolean);
  return [...fromEnv, ...fromConst];
}

/**
 * Blob-backed sources for appeal examples: manual/env entries plus every file under
 * Vercel Blob folder `Sample documents/` (see `listSampleDocumentBlobSources`).
 * Manual/env rows override the same `blobUrl` from the automatic list.
 */
export async function getAppealLetterBlobSources(): Promise<BlobBackedGeminiSource[]> {
  const manualAndEnv = [...APPEAL_LETTER_EXAMPLE_BLOB_SOURCES, ...parseEnvJsonBlobSources()].filter(
    (s) => s.displayName.length > 0 && s.blobUrl.length > 0,
  );
  const fromSampleFolder = await listSampleDocumentBlobSources();
  const urlSet = new Set(manualAndEnv.map((s) => s.blobUrl));
  const merged = [
    ...manualAndEnv,
    ...fromSampleFolder.filter((s) => !urlSet.has(s.blobUrl)),
  ];
  return merged;
}

/**
 * @deprecated Use getDirectAppealLetterExampleUris — same behavior (direct URIs only).
 */
export function getAppealLetterExampleFileUris(): string[] {
  return getDirectAppealLetterExampleUris();
}
