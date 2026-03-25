/**
 * Client-side validation aligned with {@link CityTariff} Mongoose schema
 * (required fields and enums). Used by the admin city tariff editor before save.
 */

export interface CityTariffValidationIssue {
  path: string;
  message: string;
}

/** Loose input shape from the editor (matches JSON body sent to API). */
export interface CityTariffPayloadInput {
  cityName: string;
  cityNameEn: string;
  slug: string;
  year: number;
  ordinanceUrl?: string;
  availableZones: { code: string; label: string }[];
  types: {
    category?: 'private' | 'business';
    code: string;
    label: string;
    subtypes: {
      code: string;
      label: string;
      hasSizeRanges: boolean;
      isProgressiveRate?: boolean;
      zones: {
        zone: string;
        zoneLabel: string;
        rate?: number;
        sizeRanges?: { min: number; max: number; rate: number; propertyCode?: string }[];
        propertyCode?: string;
      }[];
    }[];
  }[];
  exemptions: {
    sectionCode: string;
    sectionLabel: string;
    subSections: {
      code: string;
      description: string;
      discountPercent: number;
      restrictions?: { maxAreaSqm?: number; minChildren?: number; minHouseholdSize?: number };
      requiresDocuments: boolean;
      documentTypes: string[];
    }[];
  }[];
}

function trimNonEmpty(s: string | undefined | null): boolean {
  return typeof s === 'string' && s.trim().length > 0;
}

function isValidOptionalHttpUrl(s: string): boolean {
  try {
    const u = new URL(s);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Same normalization as the editor uses in `handleSave` before `fetch`. */
export function normalizeCityTariffPayload(raw: CityTariffPayloadInput): CityTariffPayloadInput {
  return {
    ...raw,
    types: raw.types.map((t) => ({
      ...t,
      category: t.category ?? 'private',
      subtypes: t.subtypes.map((s) => ({
        ...s,
        isProgressiveRate: s.isProgressiveRate ?? false,
      })),
    })),
    exemptions: raw.exemptions.map((sec) => ({
      ...sec,
      subSections: sec.subSections.map((sub) => ({
        ...sub,
        restrictions: sub.restrictions ?? {},
        requiresDocuments: sub.requiresDocuments ?? false,
        documentTypes: Array.isArray(sub.documentTypes) ? sub.documentTypes : [],
      })),
    })),
  };
}

/**
 * Returns validation issues (Hebrew messages). Empty array means OK for schema-aligned checks.
 */
export function validateCityTariffPayload(data: CityTariffPayloadInput): CityTariffValidationIssue[] {
  const errors: CityTariffValidationIssue[] = [];

  if (!trimNonEmpty(data.cityName)) {
    errors.push({ path: 'cityName', message: 'שם העיר בעברית חובה' });
  }
  if (!trimNonEmpty(data.cityNameEn)) {
    errors.push({ path: 'cityNameEn', message: 'שם העיר באנגלית חובה' });
  }
  if (!trimNonEmpty(data.slug)) {
    errors.push({ path: 'slug', message: 'Slug חובה' });
  } else if (!SLUG_RE.test(data.slug.trim())) {
    errors.push({
      path: 'slug',
      message: 'Slug חייב להכיל אותיות אנגליות קטנות, מספרים ומקף בלבד',
    });
  }

  if (!Number.isFinite(data.year) || data.year < 1900 || data.year > 2100) {
    errors.push({ path: 'year', message: 'נא להזין שנה תקינה (1900–2100)' });
  }

  const ord = data.ordinanceUrl?.trim();
  if (ord && !isValidOptionalHttpUrl(ord)) {
    errors.push({ path: 'ordinanceUrl', message: 'כתובת URL לצו ארנונה אינה תקינה (נדרש http/https)' });
  }

  data.availableZones.forEach((z, i) => {
    if (!trimNonEmpty(z.code)) {
      errors.push({ path: `availableZones.${i}.code`, message: 'קוד אזור חובה' });
    }
    if (!trimNonEmpty(z.label)) {
      errors.push({ path: `availableZones.${i}.label`, message: 'שם אזור חובה' });
    }
  });

  data.types.forEach((t, ti) => {
    if (!trimNonEmpty(t.code)) {
      errors.push({ path: `types.${ti}.code`, message: 'קוד סוג נכס חובה' });
    }
    if (!trimNonEmpty(t.label)) {
      errors.push({ path: `types.${ti}.label`, message: 'שם סוג נכס חובה' });
    }
    const cat = t.category ?? 'private';
    if (cat !== 'private' && cat !== 'business') {
      errors.push({ path: `types.${ti}.category`, message: 'קטגוריה חייבת להיות מגורים או עסקים' });
    }

    t.subtypes.forEach((s, si) => {
      if (!trimNonEmpty(s.code)) {
        errors.push({ path: `types.${ti}.subtypes.${si}.code`, message: 'קוד תת־סוג חובה' });
      }
      if (!trimNonEmpty(s.label)) {
        errors.push({ path: `types.${ti}.subtypes.${si}.label`, message: 'שם תת־סוג חובה' });
      }

      s.zones.forEach((zr, zi) => {
        if (!trimNonEmpty(zr.zone)) {
          errors.push({
            path: `types.${ti}.subtypes.${si}.zones.${zi}.zone`,
            message: 'בחירת אזור לתעריף חובה',
          });
        }
        if (!trimNonEmpty(zr.zoneLabel)) {
          errors.push({
            path: `types.${ti}.subtypes.${si}.zones.${zi}.zoneLabel`,
            message: 'שם אזור לתעריף חובה (ודא שהקוד קיים ברשימת האזורים)',
          });
        }

        if (s.hasSizeRanges) {
          const ranges = zr.sizeRanges ?? [];
          ranges.forEach((sr, ri) => {
            if (!Number.isFinite(sr.min)) {
              errors.push({
                path: `types.${ti}.subtypes.${si}.zones.${zi}.sizeRanges.${ri}.min`,
                message: 'שדה ״מ-״ (מ״ר) חובה ומספרי',
              });
            }
            if (!Number.isFinite(sr.max)) {
              errors.push({
                path: `types.${ti}.subtypes.${si}.zones.${zi}.sizeRanges.${ri}.max`,
                message: 'שדה ״עד״ (מ״ר) חובה ומספרי',
              });
            }
            if (!Number.isFinite(sr.rate)) {
              errors.push({
                path: `types.${ti}.subtypes.${si}.zones.${zi}.sizeRanges.${ri}.rate`,
                message: 'תעריף לטווח חובה ומספרי',
              });
            }
            if (Number.isFinite(sr.min) && Number.isFinite(sr.max) && sr.max < sr.min) {
              errors.push({
                path: `types.${ti}.subtypes.${si}.zones.${zi}.sizeRanges.${ri}.max`,
                message: 'ערך ״עד״ חייב להיות גדול או שווה ל״מ-״',
              });
            }
          });
        }
      });
    });
  });

  data.exemptions.forEach((sec, ei) => {
    if (!trimNonEmpty(sec.sectionCode)) {
      errors.push({ path: `exemptions.${ei}.sectionCode`, message: 'קוד סעיף הנחה חובה' });
    }
    if (!trimNonEmpty(sec.sectionLabel)) {
      errors.push({ path: `exemptions.${ei}.sectionLabel`, message: 'שם סעיף הנחה חובה' });
    }

    sec.subSections.forEach((sub, ssi) => {
      if (!trimNonEmpty(sub.code)) {
        errors.push({ path: `exemptions.${ei}.subSections.${ssi}.code`, message: 'קוד תת־סעיף חובה' });
      }
      if (!trimNonEmpty(sub.description)) {
        errors.push({ path: `exemptions.${ei}.subSections.${ssi}.description`, message: 'תיאור תת־סעיף חובה' });
      }
      if (!Number.isFinite(sub.discountPercent)) {
        errors.push({
          path: `exemptions.${ei}.subSections.${ssi}.discountPercent`,
          message: 'אחוז הנחה חובה ומספרי',
        });
      }
    });
  });

  return errors;
}

export function validationIssuesToFieldMap(issues: CityTariffValidationIssue[]): Record<string, string> {
  const m: Record<string, string> = {};
  for (const i of issues) {
    if (!(i.path in m)) m[i.path] = i.message;
  }
  return m;
}

export type CityTariffAccordionSection = 'basic' | 'zones' | 'types' | 'exemptions';

export function accordionSectionForValidationPath(path: string): CityTariffAccordionSection {
  if (path.startsWith('availableZones')) return 'zones';
  if (path.startsWith('types')) return 'types';
  if (path.startsWith('exemptions')) return 'exemptions';
  return 'basic';
}
