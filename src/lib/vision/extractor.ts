import { getVisionModel } from './gemini-client';
import { getDocumentType, ensureDocumentTypesRegistered } from './document-types/registry';
import type { ImageInput, ExtractionResult, ExtractedField, FieldConfidence } from './types';

// ── JSON extraction helper ─────────────────────────────────────────

function extractJsonFromText(text: string): Record<string, unknown> | null {
  // Try to find JSON in the response (handles markdown code fences)
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/) || text.match(/(\{[\s\S]*\})/);
  if (!jsonMatch) return null;

  try {
    return JSON.parse(jsonMatch[1] || jsonMatch[0]);
  } catch {
    return null;
  }
}

// ── Confidence validation ──────────────────────────────────────────

const VALID_CONFIDENCES = new Set<FieldConfidence>(['high', 'medium', 'low']);

function normalizeConfidence(value: unknown): FieldConfidence {
  if (typeof value === 'string' && VALID_CONFIDENCES.has(value as FieldConfidence)) {
    return value as FieldConfidence;
  }
  return 'low';
}

// ── Generic extraction engine ──────────────────────────────────────

/**
 * Extract structured data from a document image using Gemini Vision.
 *
 * @param documentTypeId - The registered document type ID (e.g., "tax_bill")
 * @param image - The image to analyze
 * @param promptOptions - Optional context passed to the prompt builder
 * @returns Extraction result with partial data, confidence per field, and warnings
 */
export async function extractFromDocument<T extends Record<string, unknown>>(
  documentTypeId: string,
  image: ImageInput,
  promptOptions?: Record<string, unknown>,
): Promise<ExtractionResult<T>> {
  const startTime = Date.now();
  const warnings: string[] = [];

  // 0. Ensure all document types are registered
  ensureDocumentTypesRegistered();

  // 1. Get document type definition
  const docType = getDocumentType<T>(documentTypeId);

  // 2. Build the prompt
  const prompt = docType.buildPrompt(promptOptions);

  // 3. Prepare image for Gemini
  const base64Data = image.type === 'base64'
    ? image.data
    : image.data.toString('base64');

  const imagePart = {
    inlineData: {
      data: base64Data,
      mimeType: image.mimeType,
    },
  };

  // 4. Call Gemini Vision
  let responseText: string;
  try {
    const model = getVisionModel();
    const result = await model.generateContent([prompt, imagePart]);
    responseText = result.response.text();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown Gemini API error';
    return {
      success: false,
      data: {} as ExtractionResult<T>['data'],
      warnings: [`Gemini API error: ${errorMessage}`],
      documentType: documentTypeId,
      processingTimeMs: Date.now() - startTime,
    };
  }

  // 5. Parse JSON from response
  if (process.env.NODE_ENV !== 'production') {
    console.log('[Vision Extractor] Raw Gemini response (first 2000 chars):', responseText.substring(0, 2000));
  }

  const rawParsed = extractJsonFromText(responseText);
  if (!rawParsed) {
    return {
      success: false,
      data: {} as ExtractionResult<T>['data'],
      warnings: ['Gemini did not return valid JSON. Raw response was logged.'],
      documentType: documentTypeId,
      processingTimeMs: Date.now() - startTime,
    };
  }

  // 6. Extract fields with confidence
  const validatedData: ExtractionResult<T>['data'] = {} as ExtractionResult<T>['data'];

  const fields = rawParsed.fields as Record<string, {
    value: unknown;
    confidence: unknown;
    rawText?: string;
  }> | undefined;

  if (!fields || typeof fields !== 'object') {
    warnings.push('Response JSON does not contain a "fields" object');
    return {
      success: false,
      data: {} as ExtractionResult<T>['data'],
      warnings,
      documentType: documentTypeId,
      processingTimeMs: Date.now() - startTime,
    };
  }

  // Get schema shape keys for validation
  const schemaKeys = new Set(Object.keys(
    (docType.schema as unknown as { shape?: Record<string, unknown> }).shape ?? {}
  ));

  for (const [key, fieldData] of Object.entries(fields)) {
    if (!fieldData || typeof fieldData !== 'object') continue;

    // Skip fields not in schema (if we can detect schema keys)
    if (schemaKeys.size > 0 && !schemaKeys.has(key)) {
      warnings.push(`Unexpected field "${key}" from extraction — skipped`);
      continue;
    }

    const extractedField: ExtractedField<unknown> = {
      value: fieldData.value,
      confidence: normalizeConfidence(fieldData.confidence),
      rawText: typeof fieldData.rawText === 'string' ? fieldData.rawText : undefined,
    };

    (validatedData as Record<string, ExtractedField<unknown>>)[key] = extractedField;
  }

  // 7. Apply post-processing if defined
  if (docType.postProcess) {
    const values: Partial<T> = {} as Partial<T>;
    for (const [k, v] of Object.entries(validatedData)) {
      (values as Record<string, unknown>)[k] = (v as ExtractedField<unknown>).value;
    }

    const processed = docType.postProcess(values);

    for (const [k, v] of Object.entries(processed)) {
      const existing = (validatedData as Record<string, ExtractedField<unknown>>)[k];
      if (existing) {
        existing.value = v;
      }
    }
  }

  const fieldCount = Object.keys(validatedData).length;
  if (fieldCount === 0) {
    warnings.push('No fields could be extracted from the document');
  }

  return {
    success: fieldCount > 0,
    data: validatedData,
    warnings,
    documentType: documentTypeId,
    processingTimeMs: Date.now() - startTime,
  };
}
