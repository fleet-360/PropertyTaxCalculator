import type { Part } from '@google/generative-ai';
import { ensureGeminiFileUris } from '@/lib/gemini/resolveBlobToGeminiFile';
import { getVisionModel } from '@/lib/vision/gemini-client';
import type { AppealUserContext } from './buildAppealUserContext';
import {
  APPEAL_EXAMPLE_PDF_MIME_TYPE,
  getAppealLetterBlobSources,
  getDirectAppealLetterExampleUris,
} from './letter-example-uris';

function normalizeLetterText(raw: string): string {
  let t = raw.trim();
  const fence = /^```(?:\w*)?\s*([\s\S]*?)```$/m.exec(t);
  if (fence) t = fence[1]!.trim();
  return t.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}

/**
 * Generate formal Hebrew appeal letter text via Gemini (optional example PDFs as file URIs).
 */
export async function generateAppealLetterHebrew(context: AppealUserContext): Promise<string> {
  const model = getVisionModel();
  const directUris = getDirectAppealLetterExampleUris();
  const blobSources = getAppealLetterBlobSources();
  const resolvedBlobUris =
    blobSources.length > 0 ? await ensureGeminiFileUris(blobSources) : [];
  const exampleUris = [...directUris, ...resolvedBlobUris];
  const userJson = JSON.stringify(context, null, 2);

  const instruction = `You are an expert legal assistant for Israeli municipal property tax (ארנונה) appeals.

Write a formal appeal letter (מכתב השגה) in Hebrew based ONLY on the user data JSON below.
Use the attached example PDF letter(s) only as reference for tone, structure, and formality — do not copy private data from examples.

Requirements:
- Output the letter body in modern formal Hebrew, suitable for sending to an Israeli municipality.
- Use clear paragraphs separated by blank lines.
- Include the appellant's identifying details from the user data where appropriate (name, ID if present, address, property identifiers).
- Reference the tax comparison from calculationSummary when it supports the appeal (reported vs calculated payment, outcome).
- Do NOT use Markdown headings or bullet syntax; plain paragraphs only.
- Do NOT add a disclaimer that this is AI-generated; write as the appellant's letter.

User data (JSON):
${userJson}`;

  const parts: Part[] = [
    ...exampleUris.map((fileUri) => ({
      fileData: {
        mimeType: APPEAL_EXAMPLE_PDF_MIME_TYPE,
        fileUri,
      },
    })),
    { text: instruction },
  ];

  const result = await model.generateContent(parts);
  const text = result.response.text();
  const normalized = normalizeLetterText(text);
  if (!normalized || normalized.length < 80) {
    throw new Error('Gemini returned an empty or too-short appeal letter.');
  }
  return normalized;
}
