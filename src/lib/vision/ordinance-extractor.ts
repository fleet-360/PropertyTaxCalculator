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

// ── Section-level extraction types ──────────────────────────────────

export type SectionKey = 'metadata' | 'zones' | 'rates' | 'exemptions' | 'extras';

export interface SectionExtractionInput {
  sectionKey: SectionKey;
  fileBuffers: Array<{ buffer: Buffer; mimeType: string }>;
  fileName: string;
  context?: {
    availableZones?: IAvailableZone[];
    /** Existing section data — passed to AI as context and used for smart merge. */
    existingData?: Partial<ICityTariffData>;
  };
  customPrompt?: string;
}

export interface SectionExtractionResult {
  success: boolean;
  sectionKey: SectionKey;
  data: Partial<ICityTariffData>;
  warnings: string[];
  errors: string[];
  processingTimeMs: number;
}

const SECTION_LABELS: Record<SectionKey, string> = {
  metadata: 'מחלץ מידע כללי על העיר...',
  zones: 'מחלץ אזורי ארנונה...',
  rates: 'מחלץ סוגי נכסים ותעריפים...',
  exemptions: 'מחלץ הנחות ופטורים...',
  extras: 'מחלץ הנחות שטח ואגרות...',
};

export const VALID_SECTION_KEYS: ReadonlySet<string> = new Set<SectionKey>([
  'metadata', 'zones', 'rates', 'exemptions', 'extras',
]);

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

// ── Media part types for Gemini ──────────────────────────────────────

type GeminiFileDataPart = { fileData: { fileUri: string; mimeType: string } };
type GeminiInlineDataPart = { inlineData: { data: string; mimeType: string } };
type GeminiMediaPart = GeminiFileDataPart | GeminiInlineDataPart;

// ── Single pass execution ────────────────────────────────────────────

/**
 * Run a single extraction pass with an array of media parts.
 * Supports both File API URIs (PDFs) and inline base64 data (images).
 */
async function runPassWithMedia(
  prompt: string,
  mediaParts: GeminiMediaPart[],
): Promise<Record<string, unknown> | null> {
  const model = getVisionModel();

  const result = await withRetry(async () => {
    return model.generateContent([prompt, ...mediaParts]);
  });

  const responseText = result.response.text();

  if (process.env.NODE_ENV !== 'production') {
    console.log('[OrdinanceExtractor] Response (first 1500 chars):', responseText.substring(0, 1500));
  }

  return parseLlmJsonObject(responseText);
}

/** Backward-compatible wrapper for full extraction (PDF via File API). */
async function runPass(
  prompt: string,
  fileUri: string,
  mimeType: string,
): Promise<Record<string, unknown> | null> {
  return runPassWithMedia(prompt, [{ fileData: { fileUri, mimeType } }]);
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

// ── Section-level extraction ────────────────────────────────────────

/**
 * Build a compact JSON string of existing data for the given section,
 * so the AI can maintain naming/coding consistency.
 */
function buildExistingDataContext(
  sectionKey: SectionKey,
  data: Partial<ICityTariffData>,
): string | null {
  switch (sectionKey) {
    case 'zones':
      if (data.availableZones && data.availableZones.length > 0) {
        return JSON.stringify(data.availableZones, null, 2);
      }
      return null;

    case 'rates':
      if (data.types && data.types.length > 0) {
        // Send a compact version: code, label, category, subtype codes
        const compact = data.types??[]
        return JSON.stringify(compact, null, 2);
      }
      return null;

    case 'exemptions':
      if (data.exemptions && data.exemptions.length > 0) {
        const compact = data.exemptions.map((s) => ({
          sectionCode: s.sectionCode,
          sectionLabel: s.sectionLabel,
          subSections: s.subSections.map((sub) => ({ code: sub.code, description: sub.description })),
        }));
        return JSON.stringify(compact, null, 2);
      }
      return null;

    case 'extras':
      if (
        (data.areaTypeDiscounts && data.areaTypeDiscounts.length > 0) ||
        (data.cityFees && data.cityFees.length > 0)
      ) {
        return JSON.stringify(
          {
            areaTypeDiscounts: data.areaTypeDiscounts ?? [],
            cityFees: data.cityFees ?? [],
          },
          null,
          2,
        );
      }
      return null;

    default:
      return null;
  }
}

/**
 * Extract a single section from an image or PDF.
 * Runs only the relevant extraction pass and returns partial city tariff data.
 */
export async function extractOrdinanceSection(
  input: SectionExtractionInput,
  onProgress?: ProgressCallback,
): Promise<SectionExtractionResult> {
  const startTime = Date.now();
  const warnings: string[] = [];
  const errors: string[] = [];
  const { sectionKey, fileBuffers, fileName, context, customPrompt } = input;

  onProgress?.({ pass: 0, total: 1, label: 'מכין קבצים...', percent: 5 });

  // ── Prepare media parts ─────────────────────────────────────────
  const mediaParts: GeminiMediaPart[] = [];
  let uploadedFileName: string | null = null;

  try {
    // Separate PDFs from images
    const pdfBuffers = fileBuffers.filter((f) => f.mimeType === 'application/pdf');
    const imageBuffers = fileBuffers.filter((f) => f.mimeType !== 'application/pdf');

    // Upload PDFs to Gemini File API (only 1 PDF expected)
    if (pdfBuffers.length > 0) {
      onProgress?.({ pass: 0, total: 1, label: 'מעלה קובץ PDF...', percent: 10 });
      const fileMetadata = await uploadPdfForExtraction(pdfBuffers[0].buffer, fileName);
      uploadedFileName = fileMetadata.name;
      mediaParts.push({ fileData: { fileUri: fileMetadata.uri, mimeType: fileMetadata.mimeType } });
    }

    // Add inline images
    for (const img of imageBuffers) {
      mediaParts.push({
        inlineData: {
          data: img.buffer.toString('base64'),
          mimeType: img.mimeType,
        },
      });
    }

    if (mediaParts.length === 0) {
      return {
        success: false,
        sectionKey,
        data: {},
        warnings,
        errors: ['לא סופקו קבצים לחילוץ'],
        processingTimeMs: Date.now() - startTime,
      };
    }

    // ── Build prompt ──────────────────────────────────────────────
    onProgress?.({ pass: 1, total: 1, label: SECTION_LABELS[sectionKey], percent: 25 });

    let prompt: string;
    switch (sectionKey) {
      case 'metadata':
        prompt = await buildMetadataPrompt();
        break;
      case 'zones':
        prompt = await buildZonesPrompt();
        break;
      case 'rates': {
        const zones = context?.availableZones;
        if (!zones || zones.length === 0) {
          return {
            success: false,
            sectionKey,
            data: {},
            warnings,
            errors: ['חילוץ תעריפים דורש רשימת אזורים — הגדר אזורים קודם'],
            processingTimeMs: Date.now() - startTime,
          };
        }
        prompt = await buildRatesPrompt(zones);
        break;
      }
      case 'exemptions':
        prompt = await buildExemptionsPrompt();
        break;
      case 'extras':
        prompt = await buildExtrasPrompt();
        break;
    }

    // Append existing data as context so the AI can maintain consistency
    const existingData = context?.existingData;
    if (existingData) {
      const existingJson = buildExistingDataContext(sectionKey, existingData);
      if (existingJson) {
        prompt += `\n\nנתונים קיימים (לשימוש כהקשר — שמור על קודים ושמות עקביים, הוסף פריטים חדשים ועדכן קיימים):\n${existingJson}`;
      }
    }

    // Append custom instructions if provided
    if (customPrompt?.trim()) {
      prompt += `\n\nהנחיות נוספות מהמשתמש:\n${customPrompt.trim()}`;
    }

    // ── Run pass ──────────────────────────────────────────────────
    onProgress?.({ pass: 1, total: 1, label: SECTION_LABELS[sectionKey], percent: 50 });

    const result = await runPassWithMedia(prompt, mediaParts);

    onProgress?.({ pass: 1, total: 1, label: 'מעבד תוצאות...', percent: 85 });

    // ── Extract & sanitize section data ───────────────────────────
    const data: Partial<ICityTariffData> = {};

    if (!result) {
      errors.push(`לא הצלחנו לחלץ ${SECTION_LABELS[sectionKey].replace('מחלץ ', '').replace('...', '')}`);
    } else {
      switch (sectionKey) {
        case 'metadata':
          if (typeof result.cityName === 'string') data.cityName = result.cityName;
          if (typeof result.cityNameEn === 'string') data.cityNameEn = result.cityNameEn;
          if (typeof result.year === 'number') data.year = result.year;
          if (typeof result.slug === 'string') data.slug = result.slug;
          break;

        case 'zones':
          if (Array.isArray(result.availableZones)) {
            data.availableZones = (result.availableZones as IAvailableZone[]).filter(
              (z) => z && typeof z.code === 'string' && typeof z.label === 'string',
            );
          }
          if (!data.availableZones || data.availableZones.length === 0) {
            warnings.push('לא נמצאו אזורי ארנונה');
          }
          break;

        case 'rates':
          if (Array.isArray(result.types)) {
            data.types = sanitizePropertyTypes(result.types as IPropertyType[]);
          }
          if (!data.types || data.types.length === 0) {
            warnings.push('לא נמצאו סוגי נכסים ותעריפים');
          }
          break;

        case 'exemptions':
          if (Array.isArray(result.exemptions)) {
            data.exemptions = sanitizeExemptions(result.exemptions as IExemptionSection[]);
          }
          if (!data.exemptions || data.exemptions.length === 0) {
            warnings.push('לא נמצאו הנחות');
          }
          break;

        case 'extras':
          if (Array.isArray(result.areaTypeDiscounts)) {
            data.areaTypeDiscounts = (result.areaTypeDiscounts as IAreaTypeDiscount[]).filter(
              (d) => d && typeof d.areaType === 'string' && typeof d.discountPercent === 'number',
            );
          }
          if (Array.isArray(result.cityFees)) {
            data.cityFees = (result.cityFees as ICityFee[]).filter(
              (f) => f && typeof f.name === 'string' && typeof f.amount === 'number',
            );
          }
          break;
      }
    }

    // ── Merge with existing data ────────────────────────────────────
    onProgress?.({ pass: 1, total: 1, label: 'ממזג נתונים...', percent: 92 });

    const mergedData = mergeSectionData(sectionKey, existingData, data);

    onProgress?.({ pass: 1, total: 1, label: 'הושלם', percent: 100 });

    const hasData = Object.keys(mergedData).length > 0;

    return {
      success: hasData && errors.length === 0,
      sectionKey,
      data: mergedData,
      warnings,
      errors,
      processingTimeMs: Date.now() - startTime,
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      sectionKey,
      data: {},
      warnings,
      errors: [`שגיאה בחילוץ: ${msg}`],
      processingTimeMs: Date.now() - startTime,
    };
  } finally {
    // Clean up uploaded PDF from Gemini File API
    if (uploadedFileName) {
      await deleteUploadedFile(uploadedFileName);
    }
  }
}

// ── Merge helpers (smart merge: match by code, overwrite if exists, add if new) ──

/**
 * Generic array merge: match items by a key field, overwrite matching items,
 * add new items, keep existing items not present in the new array.
 */
function mergeArrayByKey<T>(
  existing: T[],
  incoming: T[],
  keyField: keyof T,
): T[] {
  const merged = [...existing];
  const existingKeyMap = new Map(existing.map((item, idx) => [item[keyField], idx]));

  for (const newItem of incoming) {
    const key = newItem[keyField];
    const existingIdx = existingKeyMap.get(key);
    if (existingIdx !== undefined) {
      // Overwrite existing item
      merged[existingIdx] = newItem;
    } else {
      // Add new item
      merged.push(newItem);
    }
  }

  return merged;
}

/**
 * Merge extracted section data with existing city data.
 * - Items with matching codes are overwritten by the new extraction.
 * - New items (not in existing) are added.
 * - Existing items not in the extraction are preserved.
 */
function mergeSectionData(
  sectionKey: SectionKey,
  existing: Partial<ICityTariffData> | undefined,
  extracted: Partial<ICityTariffData>,
): Partial<ICityTariffData> {
  if (!existing) return extracted;

  const merged: Partial<ICityTariffData> = { ...extracted };

  switch (sectionKey) {
    case 'zones':
      if (extracted.availableZones && existing.availableZones) {
        merged.availableZones = mergeArrayByKey<IAvailableZone>(
          existing.availableZones,
          extracted.availableZones,
          'code',
        );
      }
      break;

    case 'rates':
      if (extracted.types && existing.types) {
        merged.types = mergeArrayByKey<IPropertyType>(
          existing.types,
          extracted.types,
          'code',
        );
      }
      break;

    case 'exemptions':
      if (extracted.exemptions && existing.exemptions) {
        merged.exemptions = mergeArrayByKey<IExemptionSection>(
          existing.exemptions,
          extracted.exemptions,
          'sectionCode',
        );
      }
      break;

    case 'extras':
      if (extracted.areaTypeDiscounts && existing.areaTypeDiscounts) {
        merged.areaTypeDiscounts = mergeArrayByKey<IAreaTypeDiscount>(
          existing.areaTypeDiscounts,
          extracted.areaTypeDiscounts,
          'areaType',
        );
      }
      if (extracted.cityFees && existing.cityFees) {
        merged.cityFees = mergeArrayByKey<ICityFee>(
          existing.cityFees,
          extracted.cityFees,
          'name',
        );
      }
      break;

    // metadata: simple overwrite, no merge needed
  }

  return merged;
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
      applicableTo: sec.applicableTo === 'business' ? 'business' : sec.applicableTo === 'both' ? 'both' : 'private',
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
