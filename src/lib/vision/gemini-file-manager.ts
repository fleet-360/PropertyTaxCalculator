import { GoogleAIFileManager, FileState } from '@google/generative-ai/server';
import type { FileMetadataResponse } from '@google/generative-ai/server';

// ── Singleton File Manager (same caching pattern as gemini-client.ts) ──

let cachedManager: GoogleAIFileManager | null = null;

function getFileManager(): GoogleAIFileManager {
  if (!cachedManager) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error(
        'Missing GEMINI_API_KEY environment variable. ' +
        'Set it in .env.local to use Gemini Vision features.'
      );
    }
    cachedManager = new GoogleAIFileManager(apiKey);
  }
  return cachedManager;
}

/**
 * Upload a PDF buffer to Gemini File API for multi-pass extraction.
 * Returns the file metadata including `uri` for use in generateContent calls.
 */
export async function uploadPdfForExtraction(
  pdfBuffer: Buffer,
  displayName: string,
): Promise<FileMetadataResponse> {
  const manager = getFileManager();

  const uploadResponse = await manager.uploadFile(pdfBuffer, {
    mimeType: 'application/pdf',
    displayName,
  });

  // Wait for the file to become ACTIVE (processing may take a moment)
  let file = uploadResponse.file;
  let attempts = 0;
  const maxAttempts = 30; // up to ~60 seconds

  while (file.state === FileState.PROCESSING && attempts < maxAttempts) {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    file = await manager.getFile(file.name);
    attempts++;
  }

  if (file.state !== FileState.ACTIVE) {
    throw new Error(
      `File upload failed: file state is "${file.state}" after ${attempts * 2}s. ` +
      'The PDF may be corrupted or too large for processing.'
    );
  }

  return file;
}

/**
 * Delete an uploaded file from Gemini File API (cleanup after extraction).
 */
export async function deleteUploadedFile(fileName: string): Promise<void> {
  try {
    const manager = getFileManager();
    await manager.deleteFile(fileName);
  } catch (error) {
    // Non-critical: log but don't throw. Files auto-expire after 48h anyway.
    console.warn('[gemini-file-manager] Failed to delete file:', fileName, error);
  }
}
