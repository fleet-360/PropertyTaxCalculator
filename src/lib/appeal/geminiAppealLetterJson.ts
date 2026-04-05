import type { Part, Schema } from '@google/generative-ai';
import { SchemaType } from '@google/generative-ai';
import { jsonrepair } from 'jsonrepair';
import { ensureGeminiFileRefs } from '@/lib/gemini/resolveBlobToGeminiFile';
import { getAppealLetterGenerativeModel } from '@/lib/vision/gemini-client';
import { getPrompt } from '@/lib/prompts/getPrompt';
import type { AppealUserContext } from './buildAppealUserContext';
import { listPropertyTaxOrderBlobSources } from './listPropertyTaxOrderBlobSources';
import {
  APPEAL_EXAMPLE_PDF_MIME_TYPE,
  getAppealLetterBlobSources,
  getDirectAppealLetterExampleUris,
} from './letter-example-uris';
import {
  assertVariantMatch,
  parseAppealLetterGeminiPayload,
  safeParseAppealLetterGeminiPayload,
  type AppealLetterGeminiPayload,
} from './appealLetterPayload';
import type { AppealLetterVariant } from './appealLetterVariant';
import { pickAppealBlobExamplesForGemini } from './pickAppealBlobExample';
import { pickPropertyTaxOrderBlobForCity } from './pickPropertyTaxOrderBlob';

const APPEAL_JSON_GENERATION_CONFIG_BASE = {
  temperature: 0.15,
  topP: 0.85,
  maxOutputTokens: 16384,
} as const;

const appealJsonResponseSchema: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    schemaVersion: { type: SchemaType.INTEGER },
    variant: { type: SchemaType.STRING },
    clauses: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          id: { type: SchemaType.STRING },
          body: { type: SchemaType.STRING },
          role: { type: SchemaType.STRING, nullable: true },
          headingLevel: { type: SchemaType.INTEGER, nullable: true },
          emphasis: { type: SchemaType.BOOLEAN, nullable: true },
          items: {
            type: SchemaType.ARRAY,
            nullable: true,
            items: { type: SchemaType.STRING },
          },
        },
        required: ['id', 'body'],
      },
    },
  },
  required: ['schemaVersion', 'variant', 'clauses'],
};

/** חיתוך אובייקט JSON חיצוני אם יש טקסט לפני/אחרי (לעיתים מהמודל). */
function sliceOutermostJsonObject(s: string): string {
  const start = s.indexOf('{');
  if (start < 0) return s.trim();
  const end = s.lastIndexOf('}');
  if (end <= start) return s.slice(start).trim();
  return s.slice(start, end + 1);
}

/**
 * פרסור תשובת מודל ל-JSON. ניסיון ראשון JSON.parse; אם נכשל — jsonrepair (מטפל במחרוזות עם
 * שורות חדשות גולמיות, גרשיים לא מוברחים וכו' ש-LLM לעיתים מחזיר גם ב-responseMimeType JSON).
 */
export function parseJsonFromModelText(text: string): unknown {
  let t = text.replace(/\uFEFF/g, '').trim();
  const fence = /^```(?:json)?\s*([\s\S]*?)```\s*$/m.exec(t);
  if (fence) t = fence[1]!.trim();
  t = sliceOutermostJsonObject(t);

  try {
    return JSON.parse(t) as unknown;
  } catch (firstErr) {
    try {
      const repaired = jsonrepair(t);
      const out = JSON.parse(repaired) as unknown;
      console.warn('[appeals/gemini-json] JSON.parse failed; used jsonrepair fallback:', firstErr);
      return out;
    } catch {
      throw firstErr;
    }
  }
}

/** לוג שרת: מבנה ה-JSON שחזר מ-Gemini (אחרי Zod). */
function logParsedAppealGeminiPayload(
  payload: AppealLetterGeminiPayload,
  meta: { leadId?: string | null },
): void {
  const fullBodies = process.env.APPEAL_LOG_GEMINI_JSON_FULL === '1';
  const parsedMax = Number(process.env.APPEAL_LOG_GEMINI_JSON_BODY_MAX);
  const maxBodyChars = fullBodies
    ? Infinity
    : Math.min(500_000, Math.max(200, Number.isFinite(parsedMax) ? parsedMax : 1200));

  const forLog = {
    leadId: meta.leadId ?? null,
    schemaVersion: payload.schemaVersion,
    variant: payload.variant,
    clauseCount: payload.clauses.length,
    clauses: payload.clauses.map((c) => {
      const body = c.body;
      const base = {
        id: c.id,
        role: c.role ?? null,
        headingLevel: c.headingLevel ?? null,
        emphasis: c.emphasis ?? null,
        itemsCount: c.items?.length ?? 0,
      };
      if (fullBodies || body.length <= maxBodyChars) {
        return { ...base, body };
      }
      return {
        ...base,
        body: `${body.slice(0, maxBodyChars)}… [קוצר בלוג, ${body.length} תווים בסך הכל]`,
      };
    }),
  };

  //console.log('[appeals/gemini-json] Parsed JSON from Gemini:\n', JSON.stringify(forLog, null, 2));
}

async function buildJsonInstruction(variant: AppealLetterVariant, userJson: string): Promise<string> {
  return getPrompt('appeal_letter_json', {
    variant,
    userJson,
    schemaVersion: '1',
  });
}

/**
 * Calls Gemini with JSON mode + optional responseSchema; validates with Zod; one retry on parse failure.
 */
export async function generateAppealLetterGeminiPayload(
  context: AppealUserContext,
  variant: AppealLetterVariant,
): Promise<AppealLetterGeminiPayload> {
  const model = getAppealLetterGenerativeModel();
  const directUris = getDirectAppealLetterExampleUris();
  const blobSources = await getAppealLetterBlobSources();
  const pickedBlobs = pickAppealBlobExamplesForGemini(blobSources, context);
  const resolvedBlobRefs =
    pickedBlobs.length > 0 ? await ensureGeminiFileRefs(pickedBlobs) : [];

  const orderSources = await listPropertyTaxOrderBlobSources();
  const pickedOrder = pickPropertyTaxOrderBlobForCity(orderSources, {
    slug: context.city.slug,
    name: context.city.name,
  });
  const resolvedOrderRefs = pickedOrder ? await ensureGeminiFileRefs([pickedOrder]) : [];

  const pickedPath =
    pickedBlobs[0]?.displayName?.replace(/^blob-sample:/, '') ?? null;
  const pickedOrderPath = pickedOrder?.displayName?.replace(/^blob-order:/, '') ?? null;
  console.log(
    '[appeals/gemini-json] Example PDF + structured output:',
    JSON.stringify(
      {
        leadId: context.leadId ?? null,
        variant,
        pickedBlobPath: pickedPath,
        pickedOrderPath,
        totalPdfFileParts: directUris.length + resolvedBlobRefs.length + resolvedOrderRefs.length,
      },
      null,
      2,
    ),
  );

  const userJson = JSON.stringify(context, null, 2);
  const instruction = await buildJsonInstruction(variant, userJson);

  const parts: Part[] = [
    ...directUris.map((fileUri) => ({
      fileData: {
        mimeType: APPEAL_EXAMPLE_PDF_MIME_TYPE,
        fileUri,
      },
    })),
    ...resolvedBlobRefs.map(({ fileUri, mimeType }) => ({
      fileData: {
        mimeType,
        fileUri,
      },
    })),
    ...resolvedOrderRefs.map(({ fileUri, mimeType }) => ({
      fileData: {
        mimeType,
        fileUri,
      },
    })),
    { text: instruction },
  ];

  const callModel = async (
    userParts: Part[],
    useResponseSchema: boolean,
  ): Promise<AppealLetterGeminiPayload> => {
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: userParts }],
      generationConfig: {
        ...APPEAL_JSON_GENERATION_CONFIG_BASE,
        responseMimeType: 'application/json',
        ...(useResponseSchema ? { responseSchema: appealJsonResponseSchema } : {}),
      },
    });
    const text = result.response.text();
    const raw = parseJsonFromModelText(text);
    return parseAppealLetterGeminiPayload(raw);
  };

  const hintText = (err: unknown) =>
    err instanceof Error ? err.message.slice(0, 800) : 'unknown error';

  let data: AppealLetterGeminiPayload;
  try {
    data = await callModel(parts, true);
    assertVariantMatch(data, variant);
  } catch (firstErr) {
    try {
      data = await callModel(
        [...parts, { text: `\n\nFix your previous JSON. Errors:\n${hintText(firstErr)}` }],
        true,
      );
      assertVariantMatch(data, variant);
    } catch {
      try {
        data = await callModel(parts, false);
        assertVariantMatch(data, variant);
      } catch (thirdErr) {
        data = await callModel(
          [...parts, { text: `\n\nFix your previous JSON. Errors:\n${hintText(thirdErr)}` }],
          false,
        );
        assertVariantMatch(data, variant);
      }
    }
  }

  logParsedAppealGeminiPayload(data, { leadId: context.leadId });
  return data;
}

/** Parse-only helper for tests / manual payloads */
export function parseAppealLetterPayloadFromJsonText(text: string): AppealLetterGeminiPayload {
  const raw = parseJsonFromModelText(text);
  const parsed = safeParseAppealLetterGeminiPayload(raw);
  if (!parsed.success) {
    throw parsed.error;
  }
  return parsed.data;
}
