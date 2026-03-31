import type { AppealUserContext } from './buildAppealUserContext';

/**
 * Template variant for structured letter generation (must stay aligned with
 * {@link pickAppealBlobExamplesForGemini} blob filename heuristics).
 */
export type AppealLetterVariant =
  | 'area_correction'
  | 'classification_error'
  | 'exemption_vacant'
  | 'exemption_usage'
  | 'exemption_general'
  | 'fallback';

/**
 * Same decision order as pickAppealBlobExamplesForGemini, but returns a stable variant id for merging + prompts.
 */
export function resolveAppealLetterVariant(context: AppealUserContext): AppealLetterVariant {
  const claimed = context.property.userClaimedCorrectTotalAreaSqm;
  if (claimed != null && claimed > 0) {
    return 'area_correction';
  }

  if (context.property.userSuggestedClassification?.trim()) {
    return 'classification_error';
  }

  const hay = appealVariantHaystack(context);
  if (hay.length > 0) {
    if (matchesVacantPropertyHaystack(hay)) {
      return 'exemption_vacant';
    }
    if (
      hay.includes('שאיננו בשימוש') ||
      hay.includes('איננו בשימוש') ||
      hay.includes('לא בשימוש') ||
      (hay.includes('פטור') && hay.includes('שימוש') && !matchesVacantPropertyHaystack(hay))
    ) {
      return 'exemption_usage';
    }
    if (
      hay.includes('פטורים כלליים') ||
      hay.includes('החלת פטורים') ||
      hay.includes('כלליים')
    ) {
      return 'exemption_general';
    }
  }

  return 'fallback';
}

function appealVariantHaystack(ctx: AppealUserContext): string {
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

function matchesVacantPropertyHaystack(hay: string): boolean {
  const s = hay.normalize('NFC');
  if (s.length === 0) return false;
  if (s.includes('נכס ריק')) return true;
  if (s.includes('דירה ריקה') || s.includes('דירות ריקות') || s.includes('נכסים ריקים')) {
    return true;
  }
  if (s.includes('לא מאוכלס') || s.includes('ללא מגורים')) return true;
  if (s.includes('נכס') && s.includes('ריק')) return true;
  if ((s.includes('דירה') || s.includes('דירות')) && s.includes('ריק')) return true;
  return false;
}
