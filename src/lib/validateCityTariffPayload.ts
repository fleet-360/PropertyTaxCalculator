/**
 * Client-side validation aligned with {@link CityTariff} Mongoose schema
 * (required fields and enums). Used by the admin city tariff editor before save.
 */

import type { ICityTariffData } from '@/lib/types/city-tariff';

export interface CityTariffValidationIssue {
  path: string;
  message: string;
}

/** Loose input shape from the editor (matches JSON body sent to API). */
export type CityTariffPayloadInput = ICityTariffData;

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
    areaTypeDiscounts: raw.areaTypeDiscounts ?? [],
    cityFees: raw.cityFees ?? [],
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

  const seenTypeCodes = new Set<string>();
  data.types.forEach((t, ti) => {
    if (!trimNonEmpty(t.code)) {
      errors.push({ path: `types.${ti}.code`, message: 'קוד סוג נכס חובה' });
    } else if (seenTypeCodes.has(t.code.trim())) {
      errors.push({ path: `types.${ti}.code`, message: 'קוד סוג נכס כפול' });
    } else {
      seenTypeCodes.add(t.code.trim());
    }
    if (!trimNonEmpty(t.label)) {
      errors.push({ path: `types.${ti}.label`, message: 'שם סוג נכס חובה' });
    }
    const cat = t.category ?? 'private';
    if (cat !== 'private' && cat !== 'business') {
      errors.push({ path: `types.${ti}.category`, message: 'קטגוריה חייבת להיות מגורים או עסקים' });
    }

    const seenSubtypeCodes = new Set<string>();
    t.subtypes.forEach((s, si) => {
      if (!trimNonEmpty(s.code)) {
        errors.push({ path: `types.${ti}.subtypes.${si}.code`, message: 'קוד תת־סוג חובה' });
      } else if (seenSubtypeCodes.has(s.code.trim())) {
        errors.push({
          path: `types.${ti}.subtypes.${si}.code`,
          message: 'קוד תת־סוג כפול באותו סוג נכס',
        });
      } else {
        seenSubtypeCodes.add(s.code.trim());
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
            const isLast = ri === ranges.length - 1;

            if (!Number.isFinite(sr.min)) {
              errors.push({
                path: `types.${ti}.subtypes.${si}.zones.${zi}.sizeRanges.${ri}.min`,
                message: 'שדה ״מ-״ (מ״ר) חובה ומספרי',
              });
            }

            if (isLast) {
              if (sr.max !== -1) {
                errors.push({
                  path: `types.${ti}.subtypes.${si}.zones.${zi}.sizeRanges.${ri}.max`,
                  message: 'בטווח האחרון יש להזין ‎-1‎ בשדה ״עד״ (ללא הגבלה)',
                });
              }
            } else {
              if (!Number.isFinite(sr.max)) {
                errors.push({
                  path: `types.${ti}.subtypes.${si}.zones.${zi}.sizeRanges.${ri}.max`,
                  message: 'שדה ״עד״ (מ״ר) חובה ומספרי',
                });
              }
              if (sr.max === -1) {
                errors.push({
                  path: `types.${ti}.subtypes.${si}.zones.${zi}.sizeRanges.${ri}.max`,
                  message: 'ערך ‎-1‎ מותר רק בטווח האחרון',
                });
              }
              if (Number.isFinite(sr.min) && Number.isFinite(sr.max) && sr.max < sr.min) {
                errors.push({
                  path: `types.${ti}.subtypes.${si}.zones.${zi}.sizeRanges.${ri}.max`,
                  message: 'ערך ״עד״ חייב להיות גדול או שווה ל״מ-״',
                });
              }
            }

            if (!Number.isFinite(sr.rate)) {
              errors.push({
                path: `types.${ti}.subtypes.${si}.zones.${zi}.sizeRanges.${ri}.rate`,
                message: 'תעריף לטווח חובה ומספרי',
              });
            }
          });
        }
      });
    });
  });

  // ── Area type discounts ────────────────────────────────────────────
  const seenAreaTypes = new Set<string>();
  (data.areaTypeDiscounts ?? []).forEach((d, di) => {
    if (!trimNonEmpty(d.areaType)) {
      errors.push({ path: `areaTypeDiscounts.${di}.areaType`, message: 'קוד סוג שטח חובה' });
    } else if (seenAreaTypes.has(d.areaType.trim())) {
      errors.push({ path: `areaTypeDiscounts.${di}.areaType`, message: 'קוד סוג שטח כפול' });
    } else {
      seenAreaTypes.add(d.areaType.trim());
    }
    if (!trimNonEmpty(d.label)) {
      errors.push({ path: `areaTypeDiscounts.${di}.label`, message: 'שם סוג שטח חובה' });
    }
    if (!Number.isFinite(d.discountPercent) || d.discountPercent < 0 || d.discountPercent > 100) {
      errors.push({ path: `areaTypeDiscounts.${di}.discountPercent`, message: 'אחוז הנחה חייב להיות בין 0 ל-100' });
    }
    if (!Number.isFinite(d.minimumRatePerSqm) || d.minimumRatePerSqm < 0) {
      errors.push({ path: `areaTypeDiscounts.${di}.minimumRatePerSqm`, message: 'מחיר מינימום חייב להיות 0 או יותר' });
    }
  });

  // ── City fees ─────────────────────────────────────────────────────
  (data.cityFees ?? []).forEach((f, fi) => {
    if (!trimNonEmpty(f.name)) {
      errors.push({ path: `cityFees.${fi}.name`, message: 'שם אגרה חובה' });
    }
    if (!Number.isFinite(f.amount) || f.amount < 0) {
      errors.push({ path: `cityFees.${fi}.amount`, message: 'עלות אגרה חייבת להיות 0 או יותר' });
    }
  });

  const seenSectionCodes = new Set<string>();
  data.exemptions.forEach((sec, ei) => {
    if (!trimNonEmpty(sec.sectionCode)) {
      errors.push({ path: `exemptions.${ei}.sectionCode`, message: 'קוד סעיף הנחה חובה' });
    } else if (seenSectionCodes.has(sec.sectionCode.trim())) {
      errors.push({ path: `exemptions.${ei}.sectionCode`, message: 'קוד סעיף כפול' });
    } else {
      seenSectionCodes.add(sec.sectionCode.trim());
    }
    if (!trimNonEmpty(sec.sectionLabel)) {
      errors.push({ path: `exemptions.${ei}.sectionLabel`, message: 'שם סעיף הנחה חובה' });
    }

    const seenSubsectionCodes = new Set<string>();
    sec.subSections.forEach((sub, ssi) => {
      if (!trimNonEmpty(sub.code)) {
        errors.push({ path: `exemptions.${ei}.subSections.${ssi}.code`, message: 'קוד תת־סעיף חובה' });
      } else if (seenSubsectionCodes.has(sub.code.trim())) {
        errors.push({
          path: `exemptions.${ei}.subSections.${ssi}.code`,
          message: 'קוד תת־סעיף כפול באותו סעיף',
        });
      } else {
        seenSubsectionCodes.add(sub.code.trim());
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

export type CityTariffAccordionSection = 'basic' | 'zones' | 'types' | 'exemptions' | 'areaTypeDiscounts' | 'cityFees';

export function accordionSectionForValidationPath(path: string): CityTariffAccordionSection {
  if (path.startsWith('availableZones')) return 'zones';
  if (path.startsWith('types')) return 'types';
  if (path.startsWith('exemptions')) return 'exemptions';
  if (path.startsWith('areaTypeDiscounts')) return 'areaTypeDiscounts';
  if (path.startsWith('cityFees')) return 'cityFees';
  return 'basic';
}

/**
 * Human-readable Hebrew location for admin UI (snackbar / summary list).
 */
export function formatValidationIssueLocation(path: string, data: ICityTariffData): string {
  if (path === 'cityName') return 'פרטי עיר · שם בעברית';
  if (path === 'cityNameEn') return 'פרטי עיר · שם באנגלית';
  if (path === 'slug') return 'פרטי עיר · Slug';
  if (path === 'year') return 'פרטי עיר · שנה';
  if (path === 'ordinanceUrl') return 'פרטי עיר · קישור צו ארנונה';

  let m = path.match(/^availableZones\.(\d+)\.(code|label)$/);
  if (m) {
    const i = Number(m[1]);
    const z = data.availableZones[i];
    const row = z ? `${z.code?.trim() || '—'} · ${z.label?.trim() || 'ללא שם'}` : `שורה ${i + 1}`;
    return m[2] === 'code' ? `אזורים · ${row} · קוד` : `אזורים · ${row} · שם אזור`;
  }

  m = path.match(/^types\.(\d+)\.(code|label|category)$/);
  if (m) {
    const ti = Number(m[1]);
    const t = data.types[ti];
    const name = t ? `${t.code?.trim() || '—'} · ${t.label?.trim() || 'ללא שם'}` : `סוג ${ti + 1}`;
    const field =
      m[2] === 'code' ? 'קוד סוג נכס' : m[2] === 'label' ? 'שם סוג נכס' : 'קטגוריה (מגורים/עסקים)';
    return `סוגי נכס ותעריפים · ${name} · ${field}`;
  }

  m = path.match(/^types\.(\d+)\.subtypes\.(\d+)\.(code|label)$/);
  if (m) {
    const ti = Number(m[1]);
    const si = Number(m[2]);
    const t = data.types[ti];
    const s = t?.subtypes[si];
    const typePart = t ? `${t.code?.trim() || '—'} · ${t.label?.trim() || 'ללא שם'}` : `סוג ${ti + 1}`;
    const subPart = s ? `${s.code?.trim() || '—'} · ${s.label?.trim() || 'ללא שם'}` : `תת־סוג ${si + 1}`;
    const field = m[3] === 'code' ? 'קוד תת־סוג' : 'שם תת־סוג';
    return `סוגי נכס · ${typePart} · ${subPart} · ${field}`;
  }

  m = path.match(/^types\.(\d+)\.subtypes\.(\d+)\.zones\.(\d+)\.(zone|zoneLabel)$/);
  if (m) {
    const ti = Number(m[1]);
    const si = Number(m[2]);
    const zi = Number(m[3]);
    const t = data.types[ti];
    const s = t?.subtypes[si];
    const zr = s?.zones[zi];
    const typePart = t ? `${t.code?.trim() || '—'}` : `${ti + 1}`;
    const subPart = s ? `${s.code?.trim() || '—'}` : `${si + 1}`;
    const zonePart = zr ? `${zr.zone?.trim() || '—'} · ${zr.zoneLabel?.trim() || '—'}` : `אזור ${zi + 1}`;
    const field = m[4] === 'zone' ? 'קוד אזור בתעריף' : 'שם אזור בתעריף';
    return `תעריף · סוג ${typePart} · תת־סוג ${subPart} · ${zonePart} · ${field}`;
  }

  m = path.match(
    /^types\.(\d+)\.subtypes\.(\d+)\.zones\.(\d+)\.sizeRanges\.(\d+)\.(min|max|rate)$/,
  );
  if (m) {
    const ti = Number(m[1]);
    const si = Number(m[2]);
    const zi = Number(m[3]);
    const ri = Number(m[4]);
    const t = data.types[ti];
    const s = t?.subtypes[si];
    const zr = s?.zones[zi];
    const typePart = t ? `${t.code?.trim() || '—'}` : `${ti + 1}`;
    const subPart = s ? `${s.code?.trim() || '—'}` : `${si + 1}`;
    const zonePart = zr ? `${zr.zoneLabel?.trim() || zr.zone?.trim() || '—'}` : `${zi + 1}`;
    const field =
      m[5] === 'min' ? 'טווח מ״ר · מ־' : m[5] === 'max' ? 'טווח מ״ר · עד' : 'טווח מ״ר · תעריף';
    return `תעריף · סוג ${typePart} · תת־סוג ${subPart} · אזור ${zonePart} · טווח ${ri + 1} · ${field}`;
  }

  m = path.match(/^areaTypeDiscounts\.(\d+)\.(areaType|label|discountPercent|minimumRatePerSqm)$/);
  if (m) {
    const di = Number(m[1]);
    const d = (data.areaTypeDiscounts ?? [])[di];
    const row = d ? `${d.areaType?.trim() || '—'} · ${d.label?.trim() || '—'}` : `שורה ${di + 1}`;
    const field =
      m[2] === 'areaType'
        ? 'קוד סוג שטח'
        : m[2] === 'label'
          ? 'שם'
          : m[2] === 'discountPercent'
            ? 'אחוז הנחה'
            : 'מחיר מינימום למ״ר';
    return `הנחות שטח (מרפסת וכו׳) · ${row} · ${field}`;
  }

  m = path.match(/^cityFees\.(\d+)\.(name|amount)$/);
  if (m) {
    const fi = Number(m[1]);
    const f = (data.cityFees ?? [])[fi];
    const row = f?.name?.trim() || `שורה ${fi + 1}`;
    const field = m[2] === 'name' ? 'שם אגרה' : 'עלות דו־חודשית';
    return `אגרות עירוניות · ${row} · ${field}`;
  }

  m = path.match(/^exemptions\.(\d+)\.(sectionCode|sectionLabel)$/);
  if (m) {
    const ei = Number(m[1]);
    const sec = data.exemptions[ei];
    const name = sec ? `${sec.sectionCode?.trim() || '—'} · ${sec.sectionLabel?.trim() || 'ללא שם'}` : `סעיף ${ei + 1}`;
    const field = m[2] === 'sectionCode' ? 'קוד סעיף' : 'שם סעיף';
    return `הנחות ופטורים · ${name} · ${field}`;
  }

  m = path.match(/^exemptions\.(\d+)\.subSections\.(\d+)\.(code|description|discountPercent)$/);
  if (m) {
    const ei = Number(m[1]);
    const ssi = Number(m[2]);
    const sec = data.exemptions[ei];
    const sub = sec?.subSections[ssi];
    const secName = sec ? `${sec.sectionCode?.trim() || '—'}` : `${ei + 1}`;
    const subName = sub
      ? `${sub.code?.trim() || '—'} · ${sub.description?.trim().slice(0, 24) || '—'}`
      : `תת־סעיף ${ssi + 1}`;
    const field =
      m[3] === 'code' ? 'קוד תת־סעיף' : m[3] === 'description' ? 'תיאור' : 'אחוז הנחה';
    return `הנחות ופטורים · סעיף ${secName} · ${subName} · ${field}`;
  }

  return path;
}
