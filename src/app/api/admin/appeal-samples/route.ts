import { NextRequest, NextResponse } from 'next/server';
import { del } from '@vercel/blob';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';
import {
  appealSampleGeminiDisplayName,
  appealSampleSlotPathname,
  APPEAL_SAMPLE_PDF_MIME,
  buildAppealSampleSlotViews,
  getStoredAppealLetterSamples,
  removeAppealLetterSampleSlot,
  upsertAppealLetterSampleSlot,
} from '@/lib/appeal/appealLetterSamplesConfig';
import { invalidateGeminiFileByDisplayName } from '@/lib/gemini/resolveBlobToGeminiFile';
import {
  blobUploadFailurePayload,
  BlobUploadFolder,
  uploadToBlob,
} from '@/lib/services/blobUploadService';
import { parseAppealSampleSlot } from '@/lib/types/appeal-letter-sample';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

function requireAdmin(request: NextRequest) {
  const token = getTokenFromRequest(request);
  if (!token) return null;
  return verifyToken(token);
}

// ── GET /api/admin/appeal-samples ────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    if (!requireAdmin(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const samples = await getStoredAppealLetterSamples();
    return NextResponse.json({ slots: buildAppealSampleSlotViews(samples) }, { status: 200 });
  } catch (error) {
    console.error('[api/admin/appeal-samples] GET', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ── POST /api/admin/appeal-samples ───────────────────────────────────
// Multipart: file (PDF), slot (1|2|3). Uploads to fixed slot pathname and saves SystemConfig.
export async function POST(request: NextRequest) {
  try {
    if (!requireAdmin(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file');
    const slot = parseAppealSampleSlot(formData.get('slot'));

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'file is required' }, { status: 400 });
    }
    if (!slot) {
      return NextResponse.json({ error: 'slot must be 1, 2, or 3' }, { status: 400 });
    }
    if (file.type !== APPEAL_SAMPLE_PDF_MIME) {
      return NextResponse.json({ error: 'Only PDF files are allowed' }, { status: 400 });
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 },
      );
    }

    const pathname = appealSampleSlotPathname(slot);
    const displayName = appealSampleGeminiDisplayName(pathname);

    await invalidateGeminiFileByDisplayName(displayName);

    const arrayBuffer = await file.arrayBuffer();
    const body = Buffer.from(arrayBuffer);

    const result = await uploadToBlob({
      body,
      folder: BlobUploadFolder.Samples,
      originalFilename: file.name,
      contentType: APPEAL_SAMPLE_PDF_MIME,
      addRandomSuffix: false,
      pathnameOverride: pathname,
    });

    const samples = await upsertAppealLetterSampleSlot(slot, {
      pathname: result.pathname,
      blobUrl: result.url,
      originalFilename: file.name,
      mimeType: APPEAL_SAMPLE_PDF_MIME,
    });

    return NextResponse.json({ slots: buildAppealSampleSlotViews(samples) }, { status: 200 });
  } catch (error) {
    const { status, body } = blobUploadFailurePayload(error);
    if (status >= 500) {
      console.error('[api/admin/appeal-samples] POST', error);
    }
    return NextResponse.json(body, { status });
  }
}

// ── DELETE /api/admin/appeal-samples?slot=1 ────────────────────────────
export async function DELETE(request: NextRequest) {
  try {
    if (!requireAdmin(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const slot = parseAppealSampleSlot(request.nextUrl.searchParams.get('slot'));
    if (!slot) {
      return NextResponse.json({ error: 'slot must be 1, 2, or 3' }, { status: 400 });
    }

    const pathname = appealSampleSlotPathname(slot);
    const displayName = appealSampleGeminiDisplayName(pathname);

    await invalidateGeminiFileByDisplayName(displayName);

    const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
    if (token) {
      try {
        await del(pathname, { token });
      } catch (err) {
        console.warn('[api/admin/appeal-samples] blob delete failed:', err);
      }
    }

    const samples = await removeAppealLetterSampleSlot(slot);
    return NextResponse.json({ slots: buildAppealSampleSlotViews(samples) }, { status: 200 });
  } catch (error) {
    console.error('[api/admin/appeal-samples] DELETE', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
