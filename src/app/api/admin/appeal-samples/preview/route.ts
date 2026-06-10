import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';
import { getAppealLetterSampleForSlot } from '@/lib/appeal/appealLetterSamplesConfig';
import { fetchBlobUrlAsBuffer } from '@/lib/gemini/resolveBlobToGeminiFile';
import { parseAppealSampleSlot } from '@/lib/types/appeal-letter-sample';

function contentDisposition(fileName: string, mode: 'inline' | 'attachment'): string {
  const safe = fileName.replace(/[\r\n"]/g, '_');
  const encoded = encodeURIComponent(fileName).replace(/'/g, '%27');
  return `${mode}; filename="${safe}"; filename*=UTF-8''${encoded}`;
}

// ── GET /api/admin/appeal-samples/preview?slot=1 ─────────────────────
export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token || !verifyToken(token)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const slot = parseAppealSampleSlot(request.nextUrl.searchParams.get('slot'));
    if (!slot) {
      return NextResponse.json({ error: 'slot must be 1, 2, or 3' }, { status: 400 });
    }

    const sample = await getAppealLetterSampleForSlot(slot);
    if (!sample) {
      return NextResponse.json({ error: 'Sample not found' }, { status: 404 });
    }

    const buffer = await fetchBlobUrlAsBuffer(sample.blobUrl);
    const download = request.nextUrl.searchParams.get('download') === '1';
    const dispositionMode = download ? 'attachment' : 'inline';

    const headers = new Headers();
    headers.set('Content-Type', sample.mimeType || 'application/pdf');
    headers.set('Content-Disposition', contentDisposition(sample.originalFilename, dispositionMode));
    headers.set('Content-Length', String(buffer.length));

    return new NextResponse(new Uint8Array(buffer), { status: 200, headers });
  } catch (error) {
    console.error('[api/admin/appeal-samples/preview] GET', error);
    return NextResponse.json({ error: 'Failed to load sample PDF' }, { status: 502 });
  }
}
