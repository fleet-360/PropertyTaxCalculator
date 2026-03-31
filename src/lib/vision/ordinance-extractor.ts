/**
 * Multi-pass ordinance extraction engine.
 *
 * Uploads a PDF to Gemini File API, then runs 5 focused extraction passes
 * to build a complete ICityTariffData object.
 */

import { getVisionModel } from './gemini-client';
import { uploadPdfForExtraction, deleteUploadedFile } from './gemini-file-manager';
import {
  buildMetadataPrompt,
  buildZonesPrompt,
  buildRatesPrompt,
  buildExemptionsPrompt,
  buildExtrasPrompt,
} from './ordinance-prompts';
import { parseLlmJsonObject } from './parseLlmJson';
import { normalizeCityTariffPayload } from '@/lib/validateCityTariffPayload';
import { uploadToBlob, BlobUploadFolder } from '@/lib/services/blobUploadService';
import type {
  ICityTariffData,
  IAvailableZone,
  IPropertyType,
  IExemptionSection,
  IAreaTypeDiscount,
  ICityFee,
} from '@/lib/types/city-tariff';

// ── Types ────────────────────────────────────────────────────────────

export interface OrdinanceExtractionProgress {
  pass: number;
  total: number;
  label: string;
  percent: number;
}

export interface OrdinanceExtractionResult {
  success: boolean;
  data: ICityTariffData;
  warnings: string[];
  errors: string[];
  processingTimeMs: number;
}

type ProgressCallback = (progress: OrdinanceExtractionProgress) => void;

// ── Pass labels (Hebrew) ─────────────────────────────────────────────

const PASS_LABELS = [
  'מחלץ מידע כללי על העיר...',
  'מחלץ אזורי ארנונה...',
  'מחלץ סוגי נכסים ותעריפים...',
  'מחלץ הנחות ופטורים...',
  'מחלץ הנחות שטח ואגרות...',
];

const TOTAL_PASSES = 5;

// ── Retry helper ─────────────────────────────────────────────────────

async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 2,
  delayMs: number = 3000,
): Promise<T> {
  let lastError: Error | null = null;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      const isTransient =
        lastError.message.includes('429') ||
        lastError.message.includes('503') ||
        lastError.message.includes('500') ||
        lastError.message.includes('RESOURCE_EXHAUSTED');

      if (!isTransient || attempt === maxRetries) throw lastError;

      // Exponential backoff
      await new Promise((resolve) => setTimeout(resolve, delayMs * (attempt + 1)));
    }
  }
  throw lastError;
}

// ── Single pass execution ────────────────────────────────────────────

async function runPass(
  prompt: string,
  fileUri: string,
  mimeType: string,
): Promise<Record<string, unknown> | null> {
  const model = getVisionModel();

  const result = await withRetry(async () => {
    return model.generateContent([
      prompt,
      { fileData: { fileUri, mimeType } },
    ]);
  });

  const responseText = result.response.text();

  if (process.env.NODE_ENV !== 'production') {
    console.log('[OrdinanceExtractor] Response (first 1500 chars):', responseText.substring(0, 1500));
  }

  return parseLlmJsonObject(responseText);
}

// ── Main extraction function ─────────────────────────────────────────

export async function extractOrdinance(
  pdfBuffer: Buffer,
  fileName: string,
  onProgress?: ProgressCallback,
): Promise<OrdinanceExtractionResult> {
  const startTime = Date.now();
  const warnings: string[] = [];
  const errors: string[] = [];

  // Initialize empty result
  const data: ICityTariffData = {
    cityName: '',
    cityNameEn: '',
    slug: '',
    year: new Date().getFullYear(),
    isActive: false,
    ordinanceUrl: '',
    types: [],
    exemptions: [],
    availableZones: [],
    areaTypeDiscounts: [],
    cityFees: [],
  };

  // Upload PDF to Gemini File API
  let fileMetadata;
  try {
    onProgress?.({ pass: 0, total: TOTAL_PASSES, label: 'מעלה את הקובץ...', percent: 2 });
    fileMetadata = await uploadPdfForExtraction(pdfBuffer, fileName);
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'שגיאה בהעלאת הקובץ';
    return {
      success: false,
      data,
      warnings,
      errors: [`שגיאה בהעלאת הקובץ: ${msg}`],
      processingTimeMs: Date.now() - startTime,
    };
  }

  const fileUri = fileMetadata.uri;
  const mimeType = fileMetadata.mimeType;

  try {
    // ── Pass 1: Metadata ───────────────────────────────────────────
    onProgress?.({ pass: 1, total: TOTAL_PASSES, label: PASS_LABELS[0], percent: 10 });
    try {
      const metadataResult = await runPass(await buildMetadataPrompt(), fileUri, mimeType);
      if (metadataResult) {
        if (typeof metadataResult.cityName === 'string') data.cityName = metadataResult.cityName;
        if (typeof metadataResult.cityNameEn === 'string') data.cityNameEn = metadataResult.cityNameEn;
        if (typeof metadataResult.year === 'number') data.year = metadataResult.year;
        if (typeof metadataResult.slug === 'string') data.slug = metadataResult.slug;
      } else {
        warnings.push('לא הצלחנו לחלץ מידע כללי על העיר');
      }
    } catch (error) {
      errors.push(`שגיאה בחילוץ מידע כללי: ${error instanceof Error ? error.message : String(error)}`);
    }

    // ── Upload PDF to Vercel Blob (after metadata, so we have the slug) ──
    if (data.slug) {
      try {
        onProgress?.({ pass: 1, total: TOTAL_PASSES, label: 'שומר את צו הארנונה...', percent: 18 });
        const blobResult = await uploadToBlob({
          body: pdfBuffer,
          folder: BlobUploadFolder.Orders,
          originalFilename: fileName,
          citySlug: data.slug,
          contentType: 'application/pdf',
          addRandomSuffix: false,
        });
        data.ordinanceUrl = blobResult.url;
      } catch (error) {
        warnings.push(`לא הצלחנו לשמור את קובץ הצו: ${error instanceof Error ? error.message : String(error)}`);
      }
    } else {
      warnings.push('לא ניתן לשמור את קובץ הצו — שם העיר (slug) לא חולץ');
    }

    // ── Pass 2: Zones ──────────────────────────────────────────────
    onProgress?.({ pass: 2, total: TOTAL_PASSES, label: PASS_LABELS[1], percent: 25 });
    try {
      const zonesResult = await runPass(await buildZonesPrompt(), fileUri, mimeType);
      if (zonesResult && Array.isArray(zonesResult.availableZones)) {
        data.availableZones = (zonesResult.availableZones as IAvailableZone[]).filter(
          (z) => z && typeof z.code === 'string' && typeof z.label === 'string'
        );
      }
      if (data.availableZones.length === 0) {
        warnings.push('לא נמצאו אזורי ארנונה — ייתכן שהעיר משתמשת באזור אחד');
        data.availableZones = [{ code: 'all', label: 'כל העיר' }];
      }
    } catch (error) {
      errors.push(`שגיאה בחילוץ אזורים: ${error instanceof Error ? error.message : String(error)}`);
      data.availableZones = [{ code: 'all', label: 'כל העיר' }];
    }

    // ── Pass 3: Rates ──────────────────────────────────────────────
    onProgress?.({ pass: 3, total: TOTAL_PASSES, label: PASS_LABELS[2], percent: 45 });
    try {
      const ratesResult = await runPass(await buildRatesPrompt(data.availableZones), fileUri, mimeType);
      if (ratesResult && Array.isArray(ratesResult.types)) {
        data.types = sanitizePropertyTypes(ratesResult.types as IPropertyType[]);

        // Check for truncation — if the JSON seems incomplete, try a continuation
        const responseText = JSON.stringify(ratesResult.types);
        if (responseText.endsWith('...') || data.types.length === 0) {
          warnings.push('ייתכן שחלק מסוגי הנכסים לא חולצו — מומלץ לבדוק ידנית');
        }
      } else {
        warnings.push('לא נמצאו סוגי נכסים ותעריפים');
      }
    } catch (error) {
      errors.push(`שגיאה בחילוץ תעריפים: ${error instanceof Error ? error.message : String(error)}`);
    }

    // ── Pass 4: Exemptions ─────────────────────────────────────────
    onProgress?.({ pass: 4, total: TOTAL_PASSES, label: PASS_LABELS[3], percent: 70 });
    try {
      const exemptionsResult = await runPass(await buildExemptionsPrompt(), fileUri, mimeType);
      if (exemptionsResult && Array.isArray(exemptionsResult.exemptions)) {
        data.exemptions = sanitizeExemptions(exemptionsResult.exemptions as IExemptionSection[]);
      }
      if (data.exemptions.length === 0) {
        warnings.push('לא נמצאו הנחות — ייתכן שהצו לא כולל פרק הנחות');
      }
    } catch (error) {
      errors.push(`שגיאה בחילוץ הנחות: ${error instanceof Error ? error.message : String(error)}`);
    }

    // ── Pass 5: Extras ─────────────────────────────────────────────
    onProgress?.({ pass: 5, total: TOTAL_PASSES, label: PASS_LABELS[4], percent: 88 });
    try {
      const extrasResult = await runPass(await buildExtrasPrompt(), fileUri, mimeType);
      if (extrasResult) {
        if (Array.isArray(extrasResult.areaTypeDiscounts)) {
          data.areaTypeDiscounts = (extrasResult.areaTypeDiscounts as IAreaTypeDiscount[]).filter(
            (d) => d && typeof d.areaType === 'string' && typeof d.discountPercent === 'number'
          );
        }
        if (Array.isArray(extrasResult.cityFees)) {
          data.cityFees = (extrasResult.cityFees as ICityFee[]).filter(
            (f) => f && typeof f.name === 'string' && typeof f.amount === 'number'
          );
        }
      }
    } catch (error) {
      errors.push(`שגיאה בחילוץ הנחות שטח ואגרות: ${error instanceof Error ? error.message : String(error)}`);
    }

    // ── Normalize ──────────────────────────────────────────────────
    onProgress?.({ pass: 5, total: TOTAL_PASSES, label: 'מסיים עיבוד...', percent: 95 });

    const normalized = normalizeCityTariffPayload(data);
    Object.assign(data, normalized);

  } finally {
    // Always clean up the uploaded file
    if (fileMetadata?.name) {
      await deleteUploadedFile(fileMetadata.name);
    }
  }

  const success = data.cityName.length > 0 && data.types.length > 0;

  return {
    success,
    data,
    warnings,
    errors,
    processingTimeMs: Date.now() - startTime,
  };
}

// ── Sanitization helpers ─────────────────────────────────────────────

function sanitizePropertyTypes(types: IPropertyType[]): IPropertyType[] {
  return types
    .filter((t) => t && typeof t.code === 'string' && typeof t.label === 'string')
    .map((t) => ({
      category: t.category === 'business' ? 'business' : 'private',
      code: t.code,
      label: t.label,
      subtypes: Array.isArray(t.subtypes)
        ? t.subtypes
            .filter((s) => s && typeof s.code === 'string' && typeof s.label === 'string')
            .map((s) => ({
              code: s.code,
              label: s.label,
              hasSizeRanges: Boolean(s.hasSizeRanges),
              isProgressiveRate: Boolean(s.isProgressiveRate),
              zones: Array.isArray(s.zones)
                ? s.zones
                    .filter((z) => z && typeof z.zone === 'string')
                    .map((z) => ({
                      zone: z.zone,
                      zoneLabel: z.zoneLabel || z.zone,
                      ...(z.rate != null && typeof z.rate === 'number' ? { rate: z.rate } : {}),
                      ...(Array.isArray(z.sizeRanges) && z.sizeRanges.length > 0
                        ? {
                            sizeRanges: z.sizeRanges
                              .filter(
                                (r) =>
                                  r &&
                                  typeof r.min === 'number' &&
                                  typeof r.max === 'number' &&
                                  typeof r.rate === 'number'
                              )
                              .map((r) => ({
                                min: r.min,
                                max: r.max,
                                rate: r.rate,
                                ...(r.propertyCode ? { propertyCode: String(r.propertyCode) } : {}),
                              })),
                          }
                        : {}),
                      ...(z.propertyCode ? { propertyCode: String(z.propertyCode) } : {}),
                    }))
                : [],
            }))
        : [],
    }));
}

function sanitizeExemptions(exemptions: IExemptionSection[]): IExemptionSection[] {
  return exemptions
    .filter((sec) => sec && typeof sec.sectionCode === 'string' && typeof sec.sectionLabel === 'string')
    .map((sec) => ({
      sectionCode: sec.sectionCode,
      sectionLabel: sec.sectionLabel,
      subSections: Array.isArray(sec.subSections)
        ? sec.subSections
            .filter(
              (sub) =>
                sub &&
                typeof sub.code === 'string' &&
                typeof sub.description === 'string' &&
                typeof sub.discountPercent === 'number'
            )
            .map((sub) => ({
              code: sub.code,
              description: sub.description,
              discountPercent: Math.min(100, Math.max(0, sub.discountPercent)),
              restrictions: {
                ...(sub.restrictions?.maxAreaSqm != null
                  ? { maxAreaSqm: sub.restrictions.maxAreaSqm }
                  : {}),
                ...(sub.restrictions?.minChildren != null
                  ? { minChildren: sub.restrictions.minChildren }
                  : {}),
                ...(sub.restrictions?.minHouseholdSize != null
                  ? { minHouseholdSize: sub.restrictions.minHouseholdSize }
                  : {}),
              },
              requiresDocuments: Boolean(sub.requiresDocuments),
              documentTypes: Array.isArray(sub.documentTypes) ? sub.documentTypes : [],
            }))
        : [],
    }));
}
