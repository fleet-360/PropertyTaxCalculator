import type { WizardState } from '@/components/calculator/CalculatorWizard';
import { isValidAppealEmail } from '@/components/calculator/appealGeneratePayload';

export type AppealMissingFieldInputMode = 'text' | 'email' | 'tel';

/** Single wizard field we can collect in the appeal “complete details” dialog. */
export type AppealMissingFieldItem = {
  kind: 'field';
  key: keyof WizardState;
  labelHe: string;
  inputMode: AppealMissingFieldInputMode;
};

/** Business flow: designations must be filled in DataEntry — cannot edit inline here. */
export type AppealMissingBusinessDesignationsItem = {
  kind: 'businessDesignations';
  labelHe: string;
};

export type AppealMissingDocumentItem = AppealMissingFieldItem | AppealMissingBusinessDesignationsItem;

function hasValidBusinessDesignation(state: WizardState): boolean {
  return state.designations.some(
    (d) =>
      d.type?.trim().length > 0 &&
      d.subtype?.trim().length > 0 &&
      d.zone?.trim().length > 0 &&
      Number.isFinite(d.area) &&
      d.area > 0,
  );
}

/**
 * Fields the user could have filled in the wizard but left empty; they show as gaps/underscores
 * in the appeal PDF. Used to block generation until the user completes them (or returns to data entry).
 */
export function getAppealDocumentMissingItems(state: WizardState): AppealMissingDocumentItem[] {
  if (state.propertyType === 'business' && !hasValidBusinessDesignation(state)) {
    return [
      {
        kind: 'businessDesignations',
        labelHe: 'ייעודי נכס (סוג, תת-סוג, אזור ושטח)',
      },
    ];
  }

  const out: AppealMissingDocumentItem[] = [];

  if (!isValidAppealEmail(state.email)) {
    out.push({ kind: 'field', key: 'email', labelHe: 'דוא"ל', inputMode: 'email' });
  }
  if (!state.idNumber?.trim()) {
    out.push({
      kind: 'field',
      key: 'idNumber',
      labelHe: 'תעודת זהות / ח.פ.',
      inputMode: 'text',
    });
  }
  if (!state.phone?.trim()) {
    out.push({ kind: 'field', key: 'phone', labelHe: 'טלפון', inputMode: 'tel' });
  }
  if (!state.address?.trim()) {
    out.push({ kind: 'field', key: 'address', labelHe: 'כתובת הנכס', inputMode: 'text' });
  }
  if (!state.propertyNumber?.trim()) {
    out.push({ kind: 'field', key: 'propertyNumber', labelHe: 'מספר נכס', inputMode: 'text' });
  }
  if (!state.propertyId?.trim()) {
    out.push({ kind: 'field', key: 'propertyId', labelHe: 'זיהוי נכס', inputMode: 'text' });
  }
  if (!state.block?.trim()) {
    out.push({ kind: 'field', key: 'block', labelHe: 'גוש', inputMode: 'text' });
  }
  if (!state.parcel?.trim()) {
    out.push({ kind: 'field', key: 'parcel', labelHe: 'חלקה', inputMode: 'text' });
  }
  if (!state.classificationCode?.trim()) {
    out.push({
      kind: 'field',
      key: 'classificationCode',
      labelHe: 'סיווג גוש (לפי השומה)',
      inputMode: 'text',
    });
  }
  if (!state.propertyPurpose?.trim()) {
    out.push({
      kind: 'field',
      key: 'propertyPurpose',
      labelHe: 'יעוד / שימוש בנכס',
      inputMode: 'text',
    });
  }
  if (!state.zone?.trim()) {
    out.push({ kind: 'field', key: 'zone', labelHe: 'אזור חיוב', inputMode: 'text' });
  }
  if (!state.subType?.trim()) {
    out.push({ kind: 'field', key: 'subType', labelHe: 'סוג נכס (תת-סוג)', inputMode: 'text' });
  }
  if (!(typeof state.propertyArea === 'number' && state.propertyArea > 0)) {
    out.push({
      kind: 'field',
      key: 'propertyArea',
      labelHe: 'שטח נכס (מ"ר) לפי השומה',
      inputMode: 'text',
    });
  }

  return out;
}

export function appealMissingFieldValueAsString(state: WizardState, key: keyof WizardState): string {
  const v = state[key];
  if (key === 'propertyArea') {
    return typeof v === 'number' && v > 0 ? String(v) : '';
  }
  if (typeof v === 'string') return v;
  if (v == null) return '';
  return String(v);
}

/** Apply dialog string values back onto wizard state (only supported keys). */
export function parseAppealMissingFieldValue(
  key: keyof WizardState,
  raw: string,
): string | number {
  if (key === 'propertyArea') {
    const n = parseFloat(raw.trim().replace(',', '.'));
    return Number.isFinite(n) && n > 0 ? n : 0;
  }
  return raw.trim();
}

export function validateAppealMissingFieldValue(
  key: keyof WizardState,
  raw: string,
): string | null {
  const t = raw.trim();
  if (key === 'email') {
    return isValidAppealEmail(t) ? null : 'נא למלא כתובת דוא"ל תקינה';
  }
  if (key === 'propertyArea') {
    const n = parseFloat(t.replace(',', '.'));
    return Number.isFinite(n) && n > 0 ? null : 'נא להזין שטח חיובי במ"ר';
  }
  if (t.length === 0) return 'שדה חובה';
  if (key === 'idNumber') {
    const d = t.replace(/\s/g, '');
    if (!/^\d+$/.test(d)) return 'יש להזין ספרות בלבד';
    if (d.length < 5) return 'נא להזין לפחות 5 ספרות';
  }
  return null;
}
