import type { Part } from '@google/generative-ai';
import { ensureGeminiFileRefs } from '@/lib/gemini/resolveBlobToGeminiFile';
import { getAppealLetterGenerativeModel } from '@/lib/vision/gemini-client';
import type { AppealUserContext } from './buildAppealUserContext';
import { pickAppealBlobExamplesForGemini } from './pickAppealBlobExample';
import { normalizeAppealLetterTypos } from './appealLetterTypoNormalize';
import { reorderAppealDateAfterAnnex } from './appealLetterTextLayout';
import {
  APPEAL_EXAMPLE_PDF_MIME_TYPE,
  getAppealLetterBlobSources,
  getDirectAppealLetterExampleUris,
} from './letter-example-uris';

/** Low temperature / tight sampling so output stays close to the chosen PDF template. */
const APPEAL_LETTER_GENERATION_CONFIG = {
  temperature: 0.15,
  topP: 0.85,
  maxOutputTokens: 16384,
} as const;

function normalizeLetterText(raw: string): string {
  // Do not `.trim()` the whole letter — that deletes leading/trailing blank lines the template needs.
  let t = raw.replace(/\uFEFF/g, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const fence = /^```(?:\w*)?\s*([\s\S]*?)```\s*$/m.exec(t);
  if (fence) t = fence[1] ?? t;
  t = t.replace(/\*\*/g, '');
  // Common model/OCR mistakes in legal Hebrew
  t = t.replace(/פטור הנייל/g, 'פטור הנ"ל');
  t = t.replace(/בפטור הנייל/g, 'בפטור הנ"ל');
  t = t.replace(/הנייל מקור/g, 'הנ"ל מקור');
  t = t.replace(/הניל/g, 'הנ"ל');
  t = t.replace(/וייעודה ייעודה/g, 'וייעודה');
  t = normalizeAppealLetterTypos(t);
  t = reorderAppealDateAfterAnnex(t);
  const ln = t.split('\n');
  if (ln.length > 0) {
    ln[ln.length - 1] = (ln[ln.length - 1] ?? '').replace(/[ \t]+$/u, '');
    t = ln.join('\n');
  }
  return t;
}

/**
 * Generate formal Hebrew appeal letter text via Gemini (optional example PDFs as file URIs).
 */
export async function generateAppealLetterHebrew(context: AppealUserContext): Promise<string> {
  const model = getAppealLetterGenerativeModel();
  const directUris = getDirectAppealLetterExampleUris();
  const blobSources = await getAppealLetterBlobSources();
  const pickedBlobs = pickAppealBlobExamplesForGemini(blobSources, context);
  const resolvedBlobRefs =
    pickedBlobs.length > 0 ? await ensureGeminiFileRefs(pickedBlobs) : [];

  const pickedPath =
    pickedBlobs[0]?.displayName?.replace(/^blob-sample:/, '') ?? null;
  console.log(
    '[appeals/gemini] Example PDF sent to Gemini:',
    JSON.stringify(
      {
        leadId: context.leadId ?? null,
        blobCandidatesInFolder: blobSources.length,
        pickedBlobDisplayName: pickedBlobs[0]?.displayName ?? null,
        pickedBlobPath: pickedPath,
        pickedMimeType: pickedBlobs[0]?.mimeType ?? null,
        geminiFilesApiUri: resolvedBlobRefs[0]?.fileUri ?? null,
        directEnvExampleUrisCount: directUris.length,
        totalPdfFileParts: directUris.length + resolvedBlobRefs.length,
      },
      null,
      2,
    ),
  );

  const userJson = JSON.stringify(context, null, 2);

  const instruction = `You are an expert assistant drafting formal Israeli municipal property tax appeals (השגה בארנונה).

Attached PDF: one example appeal letter (Google Files API). The server picked it to match this case. Use it as the only wording and structure template.

FULL LENGTH AND STRUCTURE (CRITICAL)
- Reproduce the FULL document body from the example: every numbered clause, subsection, legal paragraph, closing requests, and “העתק” / distribution lines if present in the example. Do NOT shorten, summarize, or skip sections — the output must be roughly the same length and completeness as the example (often multiple pages of text).
- Keep the same numbering sequence (e.g. 1. 2. … 15.) and the same order of blocks as in the example. If the example has checklist lines or optional bullets (o / משרד…), include them in the same form; fill blanks from the user JSON where applicable or keep placeholder lines like in the template.
- PARAGRAPH INTEGRITY: finish each numbered clause before starting the next. Do not interleave sentences from clause N into clause N+1. Follow the example top-to-bottom; do not reorder blocks. Keep standard abbreviations exactly as in the template (e.g. הנ"ל with gershayim, not garbled spellings).
- CASE CITATIONS: keep בר"מ / בג"ץ / פסיקה blocks inside the same numbered clause as in the example; never move a citation paragraph above its clause or split a clause so the citation floats alone.
- HEBREW ABBREVIATIONS: use gershayim as in formal Hebrew — עפ"י, דו"ח, מ"ר, סה"כ, הנ"ל, רצ"ב — never malformed spellings such as עפייי, דוייח, or מייר for square meters. Do not output English field labels like \`:Date\` or \`Date:\`; use Hebrew \`תאריך:\` only where the template has a date line.
- DATE LINE: place the line that starts with \`תאריך:\` on its own line immediately after the paragraph that attaches the bill (e.g. the line containing \`כנספח\` / \`דו"ח חיוב\`), matching the example — not under the opening address block.
- You may OMIT law-firm letterhead only: repeated office addresses, phones, fax, email, website bars that appear at the top of example pages. Start from “לכבוד” (or equivalent opening) onward. Do not omit any substantive legal or procedural content below that.

FACTS
- Read the user JSON (and \`appealNarrativeHints\` as auxiliary context). Substitute appellant name, ID, address, city, property ids, areas, zone, subtype, payments, calculation figures, exemption labels/codes, and dates — only where the template expects case-specific data.
- Do NOT copy private details from the sample persons in the PDF. Keep generic boilerplate verbatim from the template.
- For ordinance/law citations, follow the template’s pattern; do not invent section numbers you cannot verify — use placeholders or neutral wording like the example.

OUTPUT RULES
- Hebrew plain text only: paragraphs and numbered lines as in the template. No Markdown (no **, no #, no \`- \` list syntax). Digits and numbering like “12.” in plain text are required when the template uses them.
- WHITESPACE MUST MATCH THE EXAMPLE PDF: use one newline (\\n) after each printed line exactly as line breaks appear in the example. Where the example shows a vertical gap / new paragraph, output a completely empty line (two \\n in a row). Do not merge lines; do not add or remove blank lines relative to the example.
- INDENTATION: wherever a line is indented in the example (numbered sub-clauses, “o” checklist lines, quoted blocks), start that line with a TAB character (Unicode U+0009). Use one tab per indent level shown in the example; prefer tabs over spaces for indent. Our renderer maps each leading tab to a fixed indent like Word’s default tab stops.
- Do NOT add an AI disclaimer. Write as the appellant’s letter.
- Do not explain your process or which file you used.

User data (JSON):
${userJson}`;

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
    { text: instruction },
  ];

  const result = await model.generateContent({
    contents: [{ role: 'user', parts }],
    generationConfig: APPEAL_LETTER_GENERATION_CONFIG,
  });
  const text = result.response.text();
  const normalized = normalizeLetterText(text);
  if (!normalized || normalized.length < 200) {
    throw new Error('Gemini returned an empty or too-short appeal letter.');
  }
  return normalized;
}
