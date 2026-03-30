import type { BlobBackedGeminiSource } from '@/lib/gemini/resolveBlobToGeminiFile';
import type { AppealUserContext } from './buildAppealUserContext';

/** Path segment from `listSampleDocumentBlobSources` displayName (`blob-sample:…`). */
function blobPath(s: BlobBackedGeminiSource): string {
  const prefix = 'blob-sample:';
  return s.displayName.startsWith(prefix) ? s.displayName.slice(prefix.length) : s.displayName;
}

function sortedSources(sources: BlobBackedGeminiSource[]): BlobBackedGeminiSource[] {
  return [...sources].sort((a, b) => blobPath(a).localeCompare(blobPath(b), 'he'));
}

/** Text used to match exemption-style templates (labels, purpose, applied exemption from calculation). */
function templateMatchHaystack(ctx: AppealUserContext): string {
  const parts: string[] = [];

  for (const e of ctx.exemptions ?? []) {
    for (const x of [e.label, e.sectionCode, e.subSectionCode]) {
      if (typeof x === 'string' && x.trim().length > 0) parts.push(x.trim());
    }
  }

  const purpose = ctx.property.statedPurpose?.trim();
  if (purpose) parts.push(purpose);

  const ae = ctx.tax.calculationSummary?.appliedExemption;
  if (ae != null && typeof ae === 'object') {
    const o = ae as Record<string, unknown>;
    for (const key of ['description', 'sectionLabel'] as const) {
      const v = o[key];
      if (typeof v === 'string' && v.trim().length > 0) parts.push(v.trim());
    }
  }

  for (const h of ctx.appealNarrativeHints ?? []) {
    if (h.trim().length > 0) parts.push(h.trim());
  }

  return parts.join(' ');
}

/** Vacant-property appeal: broader than substring "נכס ריק" (e.g. דירה ריקה, stated purpose). */
function matchesVacantPropertyHaystack(hay: string): boolean {
  const s = hay.normalize('NFC');
  if (s.length === 0) return false;
  if (s.includes('נכס ריק')) return true;
  if (s.includes('דירה ריקה') || s.includes('דירות ריקות') || s.includes('נכסים ריקים')) return true;
  if (s.includes('לא מאוכלס') || s.includes('ללא מגורים')) return true;
  if (s.includes('נכס') && s.includes('ריק')) return true;
  if ((s.includes('דירה') || s.includes('דירות')) && s.includes('ריק')) return true;
  return false;
}

/**
 * Pick exactly one Blob-backed example PDF for Gemini, by filename heuristics + user context.
 * Always returns one entry when `sources` is non-empty (deterministic fallback: first path, Hebrew sort).
 */
export function pickAppealBlobExamplesForGemini(
  sources: BlobBackedGeminiSource[],
  context: AppealUserContext,
): BlobBackedGeminiSource[] {
  if (sources.length === 0) return [];
  const sorted = sortedSources(sources);
  const p = (s: BlobBackedGeminiSource) => blobPath(s);
  const pick = (pred: (path: string) => boolean): BlobBackedGeminiSource | undefined =>
    sorted.find((s) => pred(p(s)));

  // 1) טעות מדידה → "תיקון שטחים"
  const claimed = context.property.userClaimedCorrectTotalAreaSqm;
  if (claimed != null && claimed > 0) {
    const m = pick((path) => path.includes('תיקון שטחים'));
    if (m) return [m];
  }

  // 2) טעות בסיווג
  if (context.property.userSuggestedClassification?.trim()) {
    const m = pick(
      (path) => path.includes('טעות בסיווג') || (path.includes('טעות') && path.includes('סיווג')),
    );
    if (m) return [m];
  }

  // 3) לפי פטור / ייעוד / תיאור פטור בחישוב
  const hay = templateMatchHaystack(context);
  if (hay.length > 0) {
    if (matchesVacantPropertyHaystack(hay)) {
      const m = pick((path) => path.includes('נכס ריק'));
      if (m) return [m];
    }
    if (
      hay.includes('שאיננו בשימוש') ||
      hay.includes('איננו בשימוש') ||
      hay.includes('לא בשימוש') ||
      (hay.includes('פטור') && hay.includes('שימוש') && !matchesVacantPropertyHaystack(hay))
    ) {
      const m = pick(
        (path) =>
          path.includes('שאיננו בשימוש') ||
          path.includes('איננו בשימוש') ||
          (path.includes('בשימוש') && path.includes('פטור')),
      );
      if (m) return [m];
    }
    if (hay.includes('פטורים כלליים') || hay.includes('החלת פטורים') || hay.includes('כלליים')) {
      const m = pick((path) => path.includes('פטורים כלליים') || path.includes('החלת פטורים'));
      if (m) return [m];
    }
    const generic = pick((path) => path.includes('החלת פטורים') || path.includes('פטורים כלליים'));
    if (generic) return [generic];
  }

  return [sorted[0]!];
}
