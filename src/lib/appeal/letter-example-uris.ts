import type { BlobBackedGeminiSource } from '@/lib/gemini/resolveBlobToGeminiFile';
import { loadAppealLetterBlobSourcesFromConfig } from '@/lib/appeal/appealLetterSamplesConfig';

export const APPEAL_EXAMPLE_PDF_MIME_TYPE = 'application/pdf' as const;

/**
 * Admin-configured appeal letter example PDFs (max 3 slots in SystemConfig).
 * These are the only blob-backed sources sent to Gemini as appeal examples.
 */
export async function getAppealLetterBlobSources(): Promise<BlobBackedGeminiSource[]> {
  return loadAppealLetterBlobSourcesFromConfig();
}
