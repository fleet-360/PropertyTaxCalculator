import type { AppealUserContext } from './buildAppealUserContext';
import { formatHebrewAppealDate } from './formatHebrewAppealDate';
import { normalizeAppealLetterTypos } from './appealLetterTypoNormalize';
import type { AppealLetterGeminiClause, AppealLetterGeminiPayload } from './appealLetterPayload';
import type { AppealLetterVariant } from './appealLetterVariant';
import type { AppealSubject } from './resolveAppealSubject';

/** שורת "העתק" קבועה — מודפסת אחרי בלוק החתימה; לא מהמודל. */
export const APPEAL_LETTER_DISTRIBUTION_LINE =
  'העתק: ועדת הנחות בארנונה / גזבר העירייה';

export interface AppealLetterHeaderModel {
  cityDisplay: string;
  fullName: string;
  idNumber: string;
  propertyNumber: string;
  propertyId: string;
  addressLine: string;
  block: string;
  parcel: string;
  subParcel: string;
  /** מהות ההשגה — single line (מטא־דאטה; לא מוצג ב-HTML כשהתבנית מינימלית) */
  appealNature: string;
  filingYearsLine: string;
}

export type AppealLetterBodyRow =
  | { type: 'checklist'; items: string[] }
  | { type: 'plain'; text: string; emphasis?: 'calc'; bold?: boolean }
  | { type: 'date'; text: string }
  | { type: 'heading'; level: 1 | 2 | 3; text: string };

export interface NormalizedAppealLetter {
  variant: AppealLetterVariant;
  /** Subject-based classification (new system). */
  subject?: AppealSubject;
  header: AppealLetterHeaderModel;
  /** שורת תאריך קבועה בלבד ב-PDF (מוצגת ב-HTML). */
  dateLine: string;
  titleLine1: string;
  titleLine2: string;
  openingBlock: string;
  bodyRows: AppealLetterBodyRow[];
  showSignaturePlaceholder: boolean;
  distributionLine: string;
  signerNameLine: string;
}

function formatMoney(n: number): string {
  const x = Math.round(n * 100) / 100;
  return new Intl.NumberFormat('he-IL', { maximumFractionDigits: 2 }).format(x);
}

function pickNumericSummary(calc: Record<string, unknown>, keys: string[]): number | undefined {
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

function buildSubstitutionMap(ctx: AppealUserContext): Record<string, string> {
  const p = ctx.property;
  const t = ctx.tax;
  const calc = t.calculationSummary ?? {};
  const area = p.areaSqm != null ? String(p.areaSqm) : '_______';
  const claimed = p.userClaimedCorrectTotalAreaSqm != null ? String(p.userClaimedCorrectTotalAreaSqm) : '___';
  const subType = (p.subType?.trim() || 'מגורים').slice(0, 120);
  const bimonthly = formatMoney(t.bimonthlyPaymentReported);

  const rateAnnual =
    pickNumericSummary(calc as Record<string, unknown>, [
      'ratePerSqmAnnual',
      'annualRatePerSqm',
      'rateAnnualPerSqm',
    ]) ?? pickNumericSummary(calc as Record<string, unknown>, ['rate', 'tariffPerSqmYear']);

  let annualCorrected = '___';
  let bimonthlyCorrected = '___';
  const claimedNum = p.userClaimedCorrectTotalAreaSqm;
  if (rateAnnual != null && claimedNum != null && claimedNum > 0) {
    const annual = claimedNum * rateAnnual;
    annualCorrected = formatMoney(annual);
    bimonthlyCorrected = formatMoney(annual / 6);
  }

  const pa = p.partialAreas;
  const balcony =
    pa?.coveredBalconySqm != null ? String(pa.coveredBalconySqm) : '_________';
  const storage = pa?.storageSqm != null ? String(pa.storageSqm) : '_________';

  return {
    fullName: ctx.fullName,
    idNumber: ctx.idNumber?.trim() || '___________',
    cityName: ctx.city.name,
    address: ctx.address?.trim() || "רח' _________",
    propertyNumber: p.propertyNumber?.trim() || '___________',
    propertyId: p.propertyId?.trim() || '___________',
    block: p.cadastral?.block?.trim() || '_______',
    parcel: p.cadastral?.parcel?.trim() || '_______',
    subParcel: '_______',
    subType,
    propertyArea: area,
    userClaimedArea: claimed,
    bimonthlyPayment: bimonthly,
    areaMain: claimed,
    areaBalcony: balcony,
    areaStorage: storage,
    ratePerSqmAnnual: rateAnnual != null ? formatMoney(rateAnnual) : '___',
    annualCorrected,
    bimonthlyCorrected,
  };
}

function applyPlaceholders(template: string, map: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => map[key] ?? `{{${key}}}`);
}

function appealNatureForVariant(variant: AppealLetterVariant): string {
  switch (variant) {
    case 'area_correction':
      return 'טעות במדידת שטחי הנכס ובחישוב הארנונה; בקשה לתיקון השומה עפ"י דין וצו הארנונה.';
    case 'classification_error':
      return 'השגה על סיווג הנכס לצורכי ארנונה; בקשה לתיקון השומה עפ"י דין וצו הארנונה.';
    case 'exemption_vacant':
      return 'בקשה למתן פטור או הנחה בגין נכס ריק / לא מאוכלס, לפי תקנות הארנונה והצו בעיר.';
    case 'exemption_usage':
      return 'בקשה למתן פטור או הנחה לפי שימוש בנכס; בקשה לתיקון החיוב עפ"י דין.';
    case 'exemption_general':
      return 'בקשה להחלת פטורים כלליים והנחות בארנונה לפי צו הארנונה בעיר.';
    default:
      return 'השגה על חיוב הארנונה ובקשה למתן הנחות או תיקון השומה לפי העובדות המפורטות להלן.';
  }
}

const GENERIC_FALLBACK_CLAUSE_BODY =
  'להלן נימוקי ההשגה והבקשה, בהתאם לנתוני הנכס, לחיוב דו-חודשי של {{bimonthlyPayment}} ₪ ולצו הארנונה בעיר {{cityName}}.';

function buildHeader(ctx: AppealUserContext, variant: AppealLetterVariant, map: Record<string, string>): AppealLetterHeaderModel {
  const filingRaw = ctx.tax.paymentPeriod?.trim() || '';
  const looksLikeBillingPeriodToken =
    filingRaw === 'monthly' ||
    filingRaw === 'bimonthly' ||
    filingRaw === 'quarterly' ||
    filingRaw === 'semi_annual' ||
    filingRaw === 'annual';

  return {
    cityDisplay: ctx.city.name,
    fullName: ctx.fullName,
    idNumber: map.idNumber,
    propertyNumber: map.propertyNumber,
    propertyId: map.propertyId,
    addressLine: map.address,
    block: map.block,
    parcel: map.parcel,
    subParcel: map.subParcel,
    appealNature: appealNatureForVariant(variant),
    filingYearsLine: filingRaw && !looksLikeBillingPeriodToken ? filingRaw : '_________',
  };
}

function clauseToBodyRow(c: AppealLetterGeminiClause, map: Record<string, string>): AppealLetterBodyRow | null {
  const bold = c.emphasis === true;

  if (c.items != null && c.items.length > 0) {
    const items = c.items
      .map((line) => normalizeAppealLetterTypos(applyPlaceholders(line.trim(), map)))
      .filter(Boolean);
    if (items.length === 0) return null;
    return { type: 'checklist', items };
  }

  const raw = c.body.trim();
  if (!raw) return null;
  const text = normalizeAppealLetterTypos(applyPlaceholders(raw, map));

  if (c.role === 'heading') {
    const level = c.headingLevel === 1 || c.headingLevel === 2 || c.headingLevel === 3 ? c.headingLevel : 2;
    return { type: 'heading', level, text };
  }

  /* מספור בתוך body מ-Gemini בלבד — בלי עמודת מספרים מהתבנית */
  return { type: 'plain', text, bold };
}

function bodyRowsFromPayload(ctx: AppealUserContext, payload: AppealLetterGeminiPayload): AppealLetterBodyRow[] {
  const map = buildSubstitutionMap(ctx);
  const sourceClauses =
    payload.clauses.length > 0
      ? payload.clauses
      : [{ id: '1', body: GENERIC_FALLBACK_CLAUSE_BODY }];

  const bodyRows: AppealLetterBodyRow[] = [];
  for (const c of sourceClauses) {
    const row = clauseToBodyRow(c, map);
    if (row) bodyRows.push(row);
  }

  if (bodyRows.length === 0) {
    bodyRows.push({
      type: 'plain',
      text: normalizeAppealLetterTypos(applyPlaceholders(GENERIC_FALLBACK_CLAUSE_BODY, map)),
    });
  }

  return bodyRows;
}

/** סעיף טקסט שנראה כשורת "העתק" שמודפסת בשרת — מוסר מהגוף כדי למנוע כפילות. */
function looksLikeAppealDistributionFooter(text: string): boolean {
  const t = text.trim().replace(/\s+/g, ' ');
  if (!t.length) return false;
  const normalized = t.replace(/[：]/g, ':');
  if (!/^העתק\s*:?/u.test(normalized)) return false;
  return /ועדת\s+הנחות|גזבר/u.test(normalized);
}

function stripTrailingDistributionClauses(rows: AppealLetterBodyRow[]): AppealLetterBodyRow[] {
  const out = [...rows];
  while (out.length > 0) {
    const last = out[out.length - 1]!;
    if (last.type !== 'plain') break;
    if (!looksLikeAppealDistributionFooter(last.text)) break;
    out.pop();
  }
  return out;
}

function finalizedBodyRows(ctx: AppealUserContext, payload: AppealLetterGeminiPayload): AppealLetterBodyRow[] {
  const map = buildSubstitutionMap(ctx);
  let rows = stripTrailingDistributionClauses(bodyRowsFromPayload(ctx, payload));
  if (rows.length === 0) {
    rows.push({
      type: 'plain',
      text: normalizeAppealLetterTypos(applyPlaceholders(GENERIC_FALLBACK_CLAUSE_BODY, map)),
    });
  }
  return rows;
}

function mainDocumentSubtitleForVariant(variant: AppealLetterVariant): string {
  if (variant === 'classification_error') {
    return 'ובקשה לתיקון סיווג לצורכי ארנונה';
  }
  return 'ובקשה למתן הנחות בארנונה';
}

/**
 * מיזוג: מטא־דאטה לכותרות קבועות ב-HTML; גוף המכתב מ-clauses של Gemini.
 */
function mergeModelLetter(
  ctx: AppealUserContext,
  payload: AppealLetterGeminiPayload,
  variant: AppealLetterVariant,
): NormalizedAppealLetter {
  const map = buildSubstitutionMap(ctx);
  return {
    variant,
    header: buildHeader(ctx, variant, map),
    dateLine: `תאריך: ${formatHebrewAppealDate(new Date())}`,
    titleLine1: 'כתב השגה על חיובי ארנונה',
    titleLine2: mainDocumentSubtitleForVariant(variant),
    openingBlock: '',
    bodyRows: finalizedBodyRows(ctx, payload),
    showSignaturePlaceholder: true,
    distributionLine: APPEAL_LETTER_DISTRIBUTION_LINE,
    signerNameLine: ctx.fullName?.trim() || '',
  };
}

/** JSON → normalized letter (כל ה-variantים — אותו מיזוג מבוסס-מודל). */
export function mergeAppealLetter(
  ctx: AppealUserContext,
  payload: AppealLetterGeminiPayload,
  variant: AppealLetterVariant,
): NormalizedAppealLetter {
  return mergeModelLetter(ctx, payload, variant);
}

/**
 * Subject-based merge — replaces variant system.
 * The subject drives the "מהות ההשגה" header and substitution map.
 */
export function mergeAppealLetterBySubject(
  ctx: AppealUserContext,
  payload: AppealLetterGeminiPayload,
  subject: AppealSubject,
): NormalizedAppealLetter {
  const map = buildSubstitutionMap(ctx);
  // Add subject-specific placeholders
  map.exemptionDescription = subject.exemptionDescription;
  map.letterSubject = subject.letterSubject;
  map.savingsAnnual = subject.savingsAnnual > 0
    ? formatMoney(subject.savingsAnnual)
    : '___';

  // Map subject to a legacy variant for backward compatibility in HTML/PDF rendering
  const legacyVariant: AppealLetterVariant =
    subject.subjectType === 'area_correction' ? 'area_correction' : 'fallback';

  const filingRaw = ctx.tax.paymentPeriod?.trim() || '';
  const looksLikeBillingPeriodToken =
    filingRaw === 'monthly' ||
    filingRaw === 'bimonthly' ||
    filingRaw === 'quarterly' ||
    filingRaw === 'semi_annual' ||
    filingRaw === 'annual';

  const header: AppealLetterHeaderModel = {
    cityDisplay: ctx.city.name,
    fullName: ctx.fullName,
    idNumber: map.idNumber,
    propertyNumber: map.propertyNumber,
    propertyId: map.propertyId,
    addressLine: map.address,
    block: map.block,
    parcel: map.parcel,
    subParcel: map.subParcel,
    appealNature: subject.letterSubject, // driven by subject, not variant switch
    filingYearsLine: filingRaw && !looksLikeBillingPeriodToken ? filingRaw : '_________',
  };

  return {
    variant: legacyVariant,
    subject,
    header,
    dateLine: `תאריך: ${formatHebrewAppealDate(new Date())}`,
    titleLine1: 'כתב השגה על חיובי ארנונה',
    titleLine2: 'ובקשה למתן הנחות בארנונה',
    openingBlock: '',
    bodyRows: finalizedBodyRows(ctx, payload),
    showSignaturePlaceholder: true,
    distributionLine: APPEAL_LETTER_DISTRIBUTION_LINE,
    signerNameLine: ctx.fullName?.trim() || '',
  };
}

/** מיזוג ל-variant תיקון שטחים — זהה ל־mergeAppealLetter (נשמר לתאימות בדיקות). */
export function mergeAreaCorrectionLetter(
  ctx: AppealUserContext,
  payload: AppealLetterGeminiPayload,
): NormalizedAppealLetter {
  return mergeModelLetter(ctx, payload, 'area_correction');
}
