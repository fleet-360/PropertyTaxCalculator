import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';

// ── Singleton Gemini client (same caching pattern as mongodb.ts) ──

let cachedClient: GoogleGenerativeAI | null = null;

function getClient(): GoogleGenerativeAI {
  if (!cachedClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error(
        'Missing GEMINI_API_KEY environment variable. ' +
        'Set it in .env.local to use Gemini Vision features.'
      );
    }
    cachedClient = new GoogleGenerativeAI(apiKey);
  }
  return cachedClient;
}

/**
 * Get the Gemini vision model instance.
 * Uses gemini-2.0-flash — fast, supports vision, cost-effective.
 */
export function getVisionModel(): GenerativeModel {
  return getClient().getGenerativeModel({ model: 'gemini-2.0-flash' });
}

const DEFAULT_APPEAL_LETTER_MODEL = 'gemini-2.0-flash';

/**
 * Model for appeal-letter generation (PDF examples + long Hebrew output).
 * Override with GEMINI_APPEAL_MODEL (e.g. `gemini-2.5-pro`) without affecting OCR/vision.
 * Use stable model ids from https://ai.google.dev/gemini-api/docs/models — dated previews often 404.
 */
export function getAppealLetterGenerativeModel(): GenerativeModel {
  const model = process.env.GEMINI_APPEAL_MODEL?.trim() || DEFAULT_APPEAL_LETTER_MODEL;
  return getClient().getGenerativeModel({ model });
}
