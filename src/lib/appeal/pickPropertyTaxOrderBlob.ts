import type { BlobBackedGeminiSource } from '@/lib/gemini/resolveBlobToGeminiFile';
import { CITY_SLUG_PATTERN } from '@/lib/services/blobUploadService';

function blobPath(s: BlobBackedGeminiSource): string {
  const prefix = 'blob-order:';
  return s.displayName.startsWith(prefix) ? s.displayName.slice(prefix.length) : s.displayName;
}

function basename(path: string): string {
  const normalized = path.replace(/\\/g, '/');
  return normalized.split('/').pop() ?? normalized;
}

function normalizeCityForMatch(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/['"`]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Picks a single city-specific property-tax order (ordinance) from blob sources.
 * Primary match is by `citySlug` prefix on filename: `<citySlug>-...`.
 * Fallback match tries to normalize `cityName` to a slug-like token.
 */
export function pickPropertyTaxOrderBlobForCity(
  sources: BlobBackedGeminiSource[],
  city: { slug?: string; name?: string },
): BlobBackedGeminiSource | null {
  if (!sources.length) return null;

  const slug = typeof city.slug === 'string' ? city.slug.trim().toLowerCase() : '';
  const name = typeof city.name === 'string' ? city.name.trim() : '';

  const desiredSlug =
    slug && CITY_SLUG_PATTERN.test(slug)
      ? slug
      : name
        ? normalizeCityForMatch(name)
        : '';

  if (!desiredSlug) return null;

  const matches = sources.filter((s) => basename(blobPath(s)).toLowerCase().startsWith(`${desiredSlug}-`));
  if (matches.length === 0) return null;

  // Deterministic: pick lexicographically-last filename (typically newest if you include year/stem).
  // (We sort by Hebrew locale too; mainly relevant if stems include Hebrew.)
  const sorted = [...matches].sort((a, b) => basename(blobPath(a)).localeCompare(basename(blobPath(b)), 'he'));
  return sorted[sorted.length - 1] ?? null;
}

