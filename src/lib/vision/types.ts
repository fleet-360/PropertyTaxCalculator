import { z } from 'zod';

// ── Confidence tracking ────────────────────────────────────────────

export type FieldConfidence = 'high' | 'medium' | 'low';

export interface ExtractedField<T = unknown> {
  value: T;
  confidence: FieldConfidence;
  rawText?: string; // original text read from document
}

// ── Extraction result ──────────────────────────────────────────────

export interface ExtractionResult<T extends Record<string, unknown> = Record<string, unknown>> {
  success: boolean;
  data: Partial<{ [K in keyof T]: ExtractedField<T[K]> }>;
  warnings: string[];
  documentType: string;
  processingTimeMs: number;
}

// ── Document type definition (the registry entry) ──────────────────

export interface DocumentTypeDefinition<T extends Record<string, unknown> = Record<string, unknown>> {
  /** Unique identifier, e.g. "tax_bill", "tax_ordinance" */
  id: string;
  /** Hebrew display name for UI */
  label: string;
  /** Zod schema for validating extracted output */
  schema: z.ZodType<T>;
  /** Build the extraction prompt. Accepts optional runtime context. */
  buildPrompt: (options?: Record<string, unknown>) => string | Promise<string>;
  /** Optional post-processing hook to normalize extracted values */
  postProcess?: (raw: Partial<T>) => Partial<T>;
}

// ── Image input ────────────────────────────────────────────────────

export type ImageInput =
  | { type: 'base64'; data: string; mimeType: string }
  | { type: 'buffer'; data: Buffer; mimeType: string };
