import { NextRequest, NextResponse } from 'next/server';
import { applySignatureToPdfBuffer } from '@/lib/appeal/applySignatureToPdf';
import {
  appealApplySignatureRequestSchema,
  stripDataUrlBase64,
} from '@/lib/appeal/schemas';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const parsed = appealApplySignatureRequestSchema.safeParse({
      ...json,
      draftPdfBase64: json.draftPdfBase64 != null ? stripDataUrlBase64(String(json.draftPdfBase64)) : '',
      signaturePngBase64:
        json.signaturePngBase64 != null ? stripDataUrlBase64(String(json.signaturePngBase64)) : '',
    });

    if (!parsed.success) {
      const msg = parsed.error.issues.map((i) => i.message).join('; ') || 'נתונים לא תקינים';
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    let pdfBuf: Buffer;
    let pngBuf: Buffer;
    try {
      pdfBuf = Buffer.from(parsed.data.draftPdfBase64, 'base64');
      pngBuf = Buffer.from(parsed.data.signaturePngBase64, 'base64');
    } catch {
      return NextResponse.json({ error: 'פורמט קבצים לא תקין' }, { status: 400 });
    }

    if (pdfBuf.length < 200 || pngBuf.length < 32) {
      return NextResponse.json({ error: 'קבצים חסרים או פגומים' }, { status: 400 });
    }

    const pngSig = pngBuf.subarray(0, 8).toString('hex');
    if (!pngSig.startsWith('89504e47')) {
      return NextResponse.json({ error: 'החתימה חייבת להיות בתמונת PNG' }, { status: 400 });
    }

    const signed = await applySignatureToPdfBuffer(pdfBuf, pngBuf);
    return NextResponse.json({
      pdfBase64: signed.toString('base64'),
      mimeType: 'application/pdf',
    });
  } catch (err) {
    console.error('[api/appeals/apply-signature]', err);
    return NextResponse.json({ error: 'מיזוג החתימה נכשל' }, { status: 500 });
  }
}
