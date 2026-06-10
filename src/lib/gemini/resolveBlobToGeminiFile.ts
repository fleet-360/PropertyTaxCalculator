import { GoogleAIFileManager, FileState, type FileMetadataResponse } from '@google/generative-ai/server';

const LIST_PAGE_SIZE = 50;
const DEFAULT_POLL_MS = 2000;
const DEFAULT_MAX_WAIT_MS = 120_000;
const EXPIRY_BUFFER_MS = 60_000;

export interface BlobBackedGeminiSource {
  displayName: string;
  blobUrl: string;
  mimeType?: string;
}

export interface EnsureGeminiFileOptions {
  /** Polling after upload / PROCESSING (default 2000ms). */
  pollIntervalMs?: number;
  pollMaxWaitMs?: number;
}

let cachedManager: GoogleAIFileManager | null = null;

export function getGeminiFileManager(): GoogleAIFileManager {
  if (!cachedManager) {
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) {
      throw new Error(
        'Missing GEMINI_API_KEY. Set it in .env to use Gemini File API resolution.',
      );
    }
    cachedManager = new GoogleAIFileManager(apiKey);
  }
  return cachedManager;
}

/** Reset cache (tests only). */
export function resetGeminiFileManagerForTests(): void {
  cachedManager = null;
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function isExpirationUsable(expirationTime: string | undefined): boolean {
  if (!expirationTime) return true;
  const t = Date.parse(expirationTime);
  if (Number.isNaN(t)) return true;
  return t > Date.now() + EXPIRY_BUFFER_MS;
}

export async function findFileByDisplayName(
  fileManager: GoogleAIFileManager,
  displayName: string,
): Promise<FileMetadataResponse | null> {
  let pageToken: string | undefined;
  do {
    const res = await fileManager.listFiles({
      pageSize: LIST_PAGE_SIZE,
      pageToken,
    });
    for (const f of res.files ?? []) {
      if (f.displayName === displayName) {
        return f;
      }
    }
    pageToken = res.nextPageToken;
  } while (pageToken);
  return null;
}

export async function waitUntilFileActive(
  fileManager: GoogleAIFileManager,
  fileName: string,
  options?: { maxWaitMs?: number; intervalMs?: number },
): Promise<FileMetadataResponse> {
  const maxWait = options?.maxWaitMs ?? DEFAULT_MAX_WAIT_MS;
  const interval = options?.intervalMs ?? DEFAULT_POLL_MS;
  const deadline = Date.now() + maxWait;

  while (Date.now() < deadline) {
    const meta = await fileManager.getFile(fileName);
    if (meta.state === FileState.FAILED) {
      throw new Error(
        meta.error?.message
          ? `Gemini file processing failed: ${meta.error.message}`
          : 'Gemini file processing failed',
      );
    }
    if (meta.state === FileState.ACTIVE) {
      return meta;
    }
    await sleep(interval);
  }
  throw new Error('Timeout waiting for Gemini file to become ACTIVE');
}

/**
 * Fetch bytes from a Vercel Blob (or any HTTPS URL).
 * If `BLOB_READ_WRITE_TOKEN` is set, sends `Authorization: Bearer` (works for many Vercel Blob URLs).
 */
export async function fetchBlobUrlAsBuffer(blobUrl: string): Promise<Buffer> {
  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  const headers: Record<string, string> = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const res = await fetch(blobUrl, { headers });
  if (!res.ok) {
    throw new Error(`Failed to download blob (${res.status}): ${blobUrl}`);
  }
  return Buffer.from(await res.arrayBuffer());
}

async function tryDeleteFile(fileManager: GoogleAIFileManager, fileName: string): Promise<void> {
  try {
    await fileManager.deleteFile(fileName);
  } catch {
    // ignore — file may already be gone
  }
}

/** Remove a cached Gemini Files API copy so the next resolve re-uploads from Blob. */
export async function invalidateGeminiFileByDisplayName(
  displayName: string,
  fileManager: GoogleAIFileManager = getGeminiFileManager(),
): Promise<void> {
  const trimmed = displayName.trim();
  if (!trimmed) return;
  const existing = await findFileByDisplayName(fileManager, trimmed);
  if (existing?.name) {
    await tryDeleteFile(fileManager, existing.name);
  }
}

/**
 * Resolve one Blob-backed document to a Gemini `fileUri` (reuse Files API copy if possible).
 */
export async function ensureGeminiFileUri(
  source: BlobBackedGeminiSource,
  fileManager: GoogleAIFileManager = getGeminiFileManager(),
  options?: EnsureGeminiFileOptions,
): Promise<string> {
  const pollOpts = {
    intervalMs: options?.pollIntervalMs ?? DEFAULT_POLL_MS,
    maxWaitMs: options?.pollMaxWaitMs ?? DEFAULT_MAX_WAIT_MS,
  };
  const { displayName, blobUrl, mimeType = 'application/pdf' } = source;
  if (!displayName.trim()) {
    throw new Error('displayName is required for Gemini file resolution');
  }
  if (!blobUrl.trim()) {
    throw new Error('blobUrl is required for Gemini file resolution');
  }

  const existing = await findFileByDisplayName(fileManager, displayName);

  if (existing) {
    if (existing.state === FileState.ACTIVE && isExpirationUsable(existing.expirationTime)) {
      return existing.uri;
    }
    if (existing.state === FileState.PROCESSING) {
      const ready = await waitUntilFileActive(fileManager, existing.name, pollOpts);
      if (isExpirationUsable(ready.expirationTime)) {
        return ready.uri;
      }
    }
    await tryDeleteFile(fileManager, existing.name);
  }

  const buffer = await fetchBlobUrlAsBuffer(blobUrl);
  if (buffer.length < 16) {
    throw new Error('Downloaded blob is empty or too small');
  }

  const uploaded = await fileManager.uploadFile(buffer, {
    displayName,
    mimeType,
  });

  const active = await waitUntilFileActive(fileManager, uploaded.file.name, pollOpts);
  return active.uri;
}

export interface ResolvedGeminiFileRef {
  fileUri: string;
  mimeType: string;
}

/** Resolves each blob-backed source to a Gemini `fileUri`, preserving `mimeType` for `generateContent`. */
export async function ensureGeminiFileRefs(
  sources: BlobBackedGeminiSource[],
  fileManager?: GoogleAIFileManager,
  options?: EnsureGeminiFileOptions,
): Promise<ResolvedGeminiFileRef[]> {
  const fm = fileManager ?? getGeminiFileManager();
  const out: ResolvedGeminiFileRef[] = [];
  for (const s of sources) {
    const fileUri = await ensureGeminiFileUri(s, fm, options);
    const mimeType = s.mimeType?.trim() || 'application/pdf';
    out.push({ fileUri, mimeType });
  }
  return out;
}

export async function ensureGeminiFileUris(
  sources: BlobBackedGeminiSource[],
  fileManager?: GoogleAIFileManager,
  options?: EnsureGeminiFileOptions,
): Promise<string[]> {
  const refs = await ensureGeminiFileRefs(sources, fileManager, options);
  return refs.map((r) => r.fileUri);
}
