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
