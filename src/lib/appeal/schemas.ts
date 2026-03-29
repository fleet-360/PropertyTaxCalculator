import { z } from 'zod';

const trimmedString = (max: number) =>
  z
    .string()
    .max(max)
    .transform((s) => s.trim());

const optionalTrimmed = (max: number) =>
  z
    .string()
    .max(max)
    .optional()
    .transform((s) => (s == null ? undefined : s.trim()));

const designationSchema = z
  .object({
    type: z.string().max(120),
    subtype: z.string().max(120),
    zone: z.string().max(120),
    area: z.number().finite().nonnegative().max(1_000_000),
  })
  .passthrough();

const selectedExemptionSchema = z
  .object({
    sectionCode: z.string().max(120).optional(),
    subSectionCode: z.string().max(120).optional(),
    label: z.string().max(500).optional(),
  })
  .passthrough();

/** POST /api/appeals/generate */
export const appealGenerateRequestSchema = z.object({
  fullName: trimmedString(200).pipe(z.string().min(1)),
  idNumber: optionalTrimmed(32),
  email: optionalTrimmed(254),
  phone: optionalTrimmed(40),
  address: optionalTrimmed(500),
  cityName: trimmedString(200).pipe(z.string().min(1)),
  citySlug: optionalTrimmed(120),
  propertyType: z.enum(['private', 'business']).optional(),
  propertyNumber: optionalTrimmed(80),
  propertyId: optionalTrimmed(80),
  propertyArea: z.number().finite().nonnegative().max(1_000_000).optional(),
  zone: optionalTrimmed(120),
  subType: optionalTrimmed(120),
  bimonthlyPayment: z.number().finite().nonnegative().max(1_000_000_000),
  calculationResult: z.record(z.string(), z.unknown()).default({}),
  designations: z.array(designationSchema).max(50).optional(),
  selectedExemptions: z.array(selectedExemptionSchema).max(80).optional(),
  householdSize: z.number().int().min(1).max(50).optional(),
  childrenCount: z.number().int().min(0).max(50).optional(),
  leadId: optionalTrimmed(32),
});

export type AppealGenerateRequest = z.infer<typeof appealGenerateRequestSchema>;

const base64Pdf = z
  .string()
  .min(100, 'חסר מסמך PDF')
  .max(12_000_000, 'קובץ PDF גדול מדי');

const base64Png = z
  .string()
  .min(50, 'חסרה חתימה')
  .max(700_000, 'תמונת חתימה גדולה מדי');

/** POST /api/appeals/apply-signature */
export const appealApplySignatureRequestSchema = z.object({
  draftPdfBase64: base64Pdf,
  signaturePngBase64: base64Png,
});

export type AppealApplySignatureRequest = z.infer<typeof appealApplySignatureRequestSchema>;

export function stripDataUrlBase64(data: string): string {
  const m = /^data:[^;]+;base64,(.+)$/i.exec(data.trim());
  return m ? m[1]!.replace(/\s/g, '') : data.replace(/\s/g, '');
}
