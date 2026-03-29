import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';
import {
  BlobUploadFolder,
  blobUploadFailurePayload,
  uploadToBlob,
} from '@/lib/services/blobUploadService';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
  'application/pdf',
]);

function parseFolder(value: string | null): BlobUploadFolder | null {
  if (value === BlobUploadFolder.Orders) {
    return BlobUploadFolder.Orders;
  }
  if (value === BlobUploadFolder.Samples) {
    return BlobUploadFolder.Samples;
  }
  return null;
}

// ── POST /api/admin/blob-upload ──────────────────────────────────────
// Multipart upload to Vercel Blob (admin only). Form fields: file, folder, citySlug (orders only).
export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file');
    const folderRaw = formData.get('folder') as string | null;
    const citySlugField = formData.get('citySlug') as string | null;

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'file is required' }, { status: 400 });
    }

    const folder = parseFolder(folderRaw);
    if (!folder) {
      return NextResponse.json(
        { error: 'folder must be "orders" or "samples"' },
        { status: 400 },
      );
    }

    // Admin selection for city is only used for property tax orders; ignore for samples.
    let citySlug: string | undefined;
    if (folder === BlobUploadFolder.Orders) {
      const slug = citySlugField?.trim();
      if (!slug) {
        return NextResponse.json(
          { error: 'citySlug is required when folder is orders' },
          { status: 400 },
        );
      }
      citySlug = slug;
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 },
      );
    }

    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return NextResponse.json(
        {
          error: `Unsupported file type: ${file.type}. Allowed: ${Array.from(ALLOWED_MIME_TYPES).join(', ')}`,
        },
        { status: 400 },
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const body = Buffer.from(arrayBuffer);

    const result = await uploadToBlob({
      body,
      folder,
      originalFilename: file.name,
      citySlug,
      contentType: file.type || undefined,
    });

    return NextResponse.json(
      {
        url: result.url,
        pathname: result.pathname,
        contentType: result.contentType,
        contentDisposition: result.contentDisposition,
        downloadUrl: result.downloadUrl,
      },
      { status: 200 },
    );
  } catch (error) {
    const { status, body } = blobUploadFailurePayload(error);
    if (status >= 500) {
      console.error('Blob upload error:', error);
    } else {
      console.warn('Blob upload rejected:', body.code, body.detail ?? body.error);
    }
    return NextResponse.json(body, { status });
  }
}
