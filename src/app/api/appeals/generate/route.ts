import { NextRequest, NextResponse } from 'next/server';
import { buildAppealUserContext } from '@/lib/appeal/buildAppealUserContext';
import { generateAppealLetterGeminiPayload } from '@/lib/appeal/geminiAppealLetterJson';
import { buildAppealLetterHtml } from '@/lib/appeal/appealLetterHtml';
import { mergeAppealLetter } from '@/lib/appeal/mergeAppealLetterDocument';
import { renderAppealPdfFromHtml } from '@/lib/appeal/renderAppealPdfFromHtml';
import { appealGenerateRequestSchema } from '@/lib/appeal/schemas';
import { resolveAppealLetterVariant } from '@/lib/appeal/appealLetterVariant';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const parsed = appealGenerateRequestSchema.safeParse(json);
    if (!parsed.success) {
      const msg = parsed.error.issues.map((i) => i.message).join('; ') || 'נתונים לא תקינים';
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    const context = buildAppealUserContext(parsed.data);
    const variant = resolveAppealLetterVariant(context);

    const payload = await generateAppealLetterGeminiPayload(context, variant);
    const doc = mergeAppealLetter(context, payload, variant);
    const html = buildAppealLetterHtml(doc);
    const pdfBuffer = await renderAppealPdfFromHtml(html);

    const pdfBase64 = pdfBuffer.toString('base64');

    return NextResponse.json({
      pdfBase64,
      mimeType: 'application/pdf',
    });
  } catch (err) {
    console.error('[api/appeals/generate]', err);
    const message = err instanceof Error ? err.message : 'שגיאה פנימית';
    return NextResponse.json(
      { error: message.includes('GEMINI') || message.includes('API') ? message : 'הכנת מכתב ההשגה נכשלה' },
      { status: 500 },
    );
  }
}
