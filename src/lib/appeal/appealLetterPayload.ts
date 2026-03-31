import { z } from 'zod';
import type { AppealLetterVariant } from './appealLetterVariant';

export const APPEAL_LETTER_JSON_SCHEMA_VERSION = 1 as const;

export const appealLetterGeminiClauseRoleSchema = z.enum(['paragraph', 'heading']);

/** בלוק אחד מ-Gemini — טקסט גולמי בלבד; עיצוב ע״י role / headingLevel / emphasis / items */
export const appealLetterGeminiClauseSchema = z
  .object({
    id: z.string().min(1).max(40),
    /** טקסט; יכול להיות ריק אם יש רק `items` (רשימת ✓) */
    body: z.string().max(100_000),
    /** כותרת מקטע מול פסקה רגילה */
    role: appealLetterGeminiClauseRoleSchema.nullish(),
    /** כאשר role=heading — רמת כותרת (השרת ממפה ל־h1–h3) */
    headingLevel: z.union([z.literal(1), z.literal(2), z.literal(3)]).nullish(),
    /** הדגשת כל הבלוק (מקביל ל־bold בתבנית) */
    emphasis: z.boolean().nullish(),
    /** אם מוגדר — מוצג כרשימת קריטריונים עם ✓ (כמו בדוגמה) */
    items: z.array(z.string().min(1).max(5000)).max(100).nullish(),
  })
  .refine((c) => c.body.trim().length > 0 || (c.items != null && c.items.length > 0), {
    message: 'חובה body לא ריק או items לא ריק',
  });

export const appealLetterGeminiPayloadSchema = z.object({
  schemaVersion: z.literal(APPEAL_LETTER_JSON_SCHEMA_VERSION),
  variant: z.string().min(1).max(64),
  clauses: z.array(appealLetterGeminiClauseSchema).max(200).default([]),
});

export type AppealLetterGeminiClause = z.infer<typeof appealLetterGeminiClauseSchema>;
export type AppealLetterGeminiPayload = z.infer<typeof appealLetterGeminiPayloadSchema>;

export function parseAppealLetterGeminiPayload(raw: unknown): AppealLetterGeminiPayload {
  return appealLetterGeminiPayloadSchema.parse(raw);
}

export function safeParseAppealLetterGeminiPayload(
  raw: unknown,
): { success: true; data: AppealLetterGeminiPayload } | { success: false; error: z.ZodError } {
  const r = appealLetterGeminiPayloadSchema.safeParse(raw);
  if (r.success) return { success: true, data: r.data };
  return { success: false, error: r.error };
}

/** Ensure API variant matches resolved template (avoid cross-template injection). */
export function assertVariantMatch(
  payload: AppealLetterGeminiPayload,
  expected: AppealLetterVariant,
): void {
  if (payload.variant !== expected) {
    throw new Error(
      `Appeal JSON variant mismatch: expected "${expected}", got "${payload.variant}".`,
    );
  }
}
