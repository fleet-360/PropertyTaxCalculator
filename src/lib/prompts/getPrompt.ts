import dbConnect from '@/lib/mongodb';
import AiPrompt from '@/lib/models/AiPrompt';
import { resolvePromptTemplate } from './resolvePrompt';
import { hardcodedDefaults } from './hardcoded-defaults';

// ── In-memory cache ──────────────────────────────────────────────────

interface CacheEntry {
  content: string;
  fetchedAt: number;
}

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const cache = new Map<string, CacheEntry>();

export function invalidatePromptCache(key: string): void {
  cache.delete(key);
}

// ── Main prompt fetcher ──────────────────────────────────────────────

/**
 * Fetch a prompt by key from the database (with cache + fallback).
 * Applies template variable substitution if `variables` is provided.
 */
export async function getPrompt(
  key: string,
  variables?: Record<string, string>,
): Promise<string> {
  let content: string | null = null;

  // 1. Check in-memory cache
  const cached = cache.get(key);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    content = cached.content;
  }

  // 2. Fetch from DB if not cached
  if (content === null) {
    try {
      await dbConnect();
      const doc = await AiPrompt.getByKey(key);
      if (doc) {
        content = doc.content;
        cache.set(key, { content, fetchedAt: Date.now() });
      }
    } catch (err) {
      console.warn(`[getPrompt] DB fetch failed for key "${key}", using fallback:`, err);
    }
  }

  // 3. Fallback to hardcoded defaults
  if (content === null) {
    const fallback = hardcodedDefaults[key];
    if (!fallback) {
      throw new Error(`No prompt found for key "${key}" (DB and hardcoded fallback both missing)`);
    }
    content = fallback;
  }

  // 4. Resolve template variables
  if (variables) {
    content = resolvePromptTemplate(content, variables);
  }

  return content;
}
