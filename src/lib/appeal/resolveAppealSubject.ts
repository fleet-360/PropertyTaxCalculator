import type { AppealUserContext } from './buildAppealUserContext';

/**
 * Subject-based appeal letter classification.
 *
 * Instead of matching against fixed variant templates, this module inspects the
 * calculation result and chooses the **single highest-value** discount or
 * exemption to focus the entire letter on.
 */

export interface AppealSubject {
  /** High-level category: area measurement dispute vs. exemption/discount claim. */
  subjectType: 'area_correction' | 'exemption';
  /** The exemption sub-section code (from the tariff), if applicable. */
  exemptionCode?: string;
  /** Hebrew description of the specific exemption / discount (e.g. "נכה 80%"). */
  exemptionDescription: string;
  /** Discount percent applied (0–100). */
  discountPercent: number;
  /** Estimated annual savings in ₪ for this exemption / correction. */
  savingsAnnual: number;
  /** Ready-to-use "מהות ההשגה" line for the letter header. */
  letterSubject: string;
  /**
   * When subjectType is 'exemption' but the user also reported an area
   * correction, this block carries the area-dispute data so the letter
   * can incorporate both requests.
   */
  includesAreaCorrection?: {
    billedAreaSqm: number;
    claimedAreaSqm: number;
    areaSavingsAnnual: number;
  };
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function pickNumeric(calc: Record<string, unknown>, keys: string[]): number | undefined {
  for (const k of keys) {
    const v = calc[k];
    if (typeof v === 'number' && Number.isFinite(v)) return v;
    if (typeof v === 'string') {
      const n = Number(v.replace(/[^\d.-]/g, ''));
      if (Number.isFinite(n)) return n;
    }
  }
  return undefined;
}

/**
 * Compute the annual savings that come from correcting the property area alone
 * (ignoring exemptions).  If the user didn't claim a corrected area → 0.
 */
function areaCorrectionSavings(ctx: AppealUserContext): number {
  const claimed = ctx.property.userClaimedCorrectTotalAreaSqm;
  if (claimed == null || claimed <= 0) return 0;

  const billed = ctx.property.areaSqm;
  if (billed == null || billed <= 0) return 0;
  if (claimed >= billed) return 0; // no savings if claimed ≥ billed

  const calc = ctx.tax.calculationSummary ?? {};
  const rate = pickNumeric(calc as Record<string, unknown>, [
    'ratePerSqmAnnual',
    'annualRatePerSqm',
    'rateAnnualPerSqm',
    'rate',
    'tariffPerSqmYear',
    'ratePerSqm',
  ]);
  if (rate == null || rate <= 0) return 0;

  return Math.max(0, (billed - claimed) * rate);
}

interface ExemptionInfo {
  code?: string;
  description: string;
  discountPercent: number;
  savingsAnnual: number;
}

/**
 * Extract exemption savings from the calculationResult.appliedExemption.
 */
function exemptionSavings(ctx: AppealUserContext): ExemptionInfo | null {
  const calc = (ctx.tax.calculationSummary ?? {}) as Record<string, unknown>;
  const ae = calc.appliedExemption;
  if (ae == null || typeof ae !== 'object') return null;

  const obj = ae as Record<string, unknown>;
  const desc =
    (typeof obj.description === 'string' && obj.description.trim()) ||
    (typeof obj.sectionLabel === 'string' && obj.sectionLabel.trim()) ||
    '';
  if (!desc) return null;

  const pct =
    typeof obj.discountPercent === 'number' ? obj.discountPercent : 0;

  // Compute savings: difference between annualBeforeExemption and annualAfterExemption
  const annualBefore = pickNumeric(calc, ['annualBeforeExemption']);
  const annualAfter = pickNumeric(calc, ['annualAfterExemption']);
  let savings = 0;
  if (annualBefore != null && annualAfter != null) {
    savings = Math.max(0, annualBefore - annualAfter);
  } else {
    // Fallback: compute from annual savings field
    const totalSavings = pickNumeric(calc, ['savingsAnnual']);
    if (totalSavings != null && totalSavings > 0) {
      savings = totalSavings;
    }
  }

  const code =
    typeof obj.subSectionCode === 'string' ? obj.subSectionCode : undefined;

  return { code, description: desc, discountPercent: pct, savingsAnnual: savings };
}

/* ------------------------------------------------------------------ */
/*  letterSubject builders                                            */
/* ------------------------------------------------------------------ */

function areaSubjectLine(): string {
  return 'טעות במדידת שטחי הנכס ובחישוב הארנונה; בקשה לתיקון השומה עפ"י דין וצו הארנונה.';
}

function exemptionSubjectLine(description: string): string {
  return `בקשה להחלת הנחה/פטור: ${description}; בקשה לתיקון השומה עפ"י דין וצו הארנונה.`;
}

function combinedSubjectLine(exemptionDescription: string): string {
  return `בקשה להחלת הנחה/פטור: ${exemptionDescription} ותיקון מדידת שטחי הנכס; בקשה לתיקון השומה עפ"י דין וצו הארנונה.`;
}

/* ------------------------------------------------------------------ */
/*  Main                                                              */
/* ------------------------------------------------------------------ */

/**
 * Determine the **single best subject** for the appeal letter by comparing the
 * monetary savings of area-correction vs. the applied exemption and choosing
 * the higher one.
 *
 * This replaces the former `resolveAppealLetterVariant` which matched against
 * keyword heuristics.
 */
export function resolveAppealSubject(ctx: AppealUserContext): AppealSubject {
  const areaSavings = areaCorrectionSavings(ctx);
  const exemption = exemptionSavings(ctx);
  const exemptionSavingsVal = exemption?.savingsAnnual ?? 0;

  // Pick whichever has higher annual savings
  if (areaSavings > 0 && areaSavings >= exemptionSavingsVal) {
    // Area correction wins
    const calc = (ctx.tax.calculationSummary ?? {}) as Record<string, unknown>;
    const rate = pickNumeric(calc, [
      'ratePerSqmAnnual', 'annualRatePerSqm', 'rateAnnualPerSqm',
      'rate', 'tariffPerSqmYear', 'ratePerSqm',
    ]) ?? 0;
    const billed = ctx.property.areaSqm ?? 0;
    const claimed = ctx.property.userClaimedCorrectTotalAreaSqm ?? 0;
    const pct = billed > 0 ? Math.round(((billed - claimed) / billed) * 100) : 0;

    return {
      subjectType: 'area_correction',
      exemptionDescription: `תיקון שטח מ-${billed} מ"ר ל-${claimed} מ"ר (תעריף ${rate > 0 ? rate.toFixed(2) : '___'} ₪/מ"ר/שנה)`,
      discountPercent: pct,
      savingsAnnual: areaSavings,
      letterSubject: areaSubjectLine(),
    };
  }

  if (exemption != null && exemptionSavingsVal > 0) {
    // Exemption wins — but if user also reported area correction, attach it
    const result: AppealSubject = {
      subjectType: 'exemption',
      exemptionCode: exemption.code,
      exemptionDescription: exemption.description,
      discountPercent: exemption.discountPercent,
      savingsAnnual: exemptionSavingsVal,
      letterSubject: exemptionSubjectLine(exemption.description),
    };

    if (areaSavings > 0) {
      const billed = ctx.property.areaSqm ?? 0;
      const claimed = ctx.property.userClaimedCorrectTotalAreaSqm ?? 0;
      result.includesAreaCorrection = {
        billedAreaSqm: billed,
        claimedAreaSqm: claimed,
        areaSavingsAnnual: areaSavings,
      };
      result.letterSubject = combinedSubjectLine(exemption.description);
      result.savingsAnnual = exemptionSavingsVal + areaSavings;
    }

    return result;
  }

  // Fallback: no concrete savings found — still generate a letter
  // Use area correction if user claimed one, otherwise generic exemption
  if (ctx.property.userClaimedCorrectTotalAreaSqm != null && ctx.property.userClaimedCorrectTotalAreaSqm > 0) {
    return {
      subjectType: 'area_correction',
      exemptionDescription: 'תיקון שטחי הנכס',
      discountPercent: 0,
      savingsAnnual: 0,
      letterSubject: areaSubjectLine(),
    };
  }

  // Generic exemption fallback
  const fallbackDesc = exemption?.description || 'הנחות והפטורים המגיעים עפ"י דין';
  return {
    subjectType: 'exemption',
    exemptionCode: exemption?.code,
    exemptionDescription: fallbackDesc,
    discountPercent: exemption?.discountPercent ?? 0,
    savingsAnnual: 0,
    letterSubject: `בקשה להחלת הנחה/פטור: ${fallbackDesc}; בקשה לתיקון השומה עפ"י דין וצו הארנונה.`,
  };
}
