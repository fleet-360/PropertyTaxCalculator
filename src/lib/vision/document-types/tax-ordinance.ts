import { z } from 'zod';
import { registerDocumentType } from './registry';
import type { DocumentTypeDefinition } from '../types';

// ── Output schema — full city tariff structure ──────────────────────

export const taxOrdinanceSchema = z.object({
  cityName: z.string().optional(),
  cityNameEn: z.string().optional(),
  slug: z.string().optional(),
  year: z.number().optional(),
  availableZones: z.array(z.object({
    code: z.string(),
    label: z.string(),
  })).optional(),
  types: z.array(z.object({
    category: z.enum(['private', 'business']),
    code: z.string(),
    label: z.string(),
    subtypes: z.array(z.any()),
  })).optional(),
  exemptions: z.array(z.object({
    sectionCode: z.string(),
    sectionLabel: z.string(),
    subSections: z.array(z.any()),
  })).optional(),
  areaTypeDiscounts: z.array(z.object({
    areaType: z.string(),
    label: z.string(),
    discountPercent: z.number(),
    minimumRatePerSqm: z.number(),
    applicableTo: z.enum(['private', 'business', 'both']).optional(),
  })).optional(),
  cityFees: z.array(z.object({
    name: z.string(),
    amount: z.number(),
    isMandatory: z.boolean(),
  })).optional(),
});

export type TaxOrdinanceData = z.infer<typeof taxOrdinanceSchema>;

// ── Register document type (for discoverability) ────────────────────
// NOTE: Actual extraction uses ordinance-extractor.ts (multi-pass),
// not the generic extractFromDocument() pipeline.

const taxOrdinanceDefinition: DocumentTypeDefinition<TaxOrdinanceData> = {
  id: 'tax_ordinance',
  label: 'צו ארנונה',
  schema: taxOrdinanceSchema,
  buildPrompt: () => '(not used — see ordinance-extractor.ts)',
};

registerDocumentType(taxOrdinanceDefinition);
