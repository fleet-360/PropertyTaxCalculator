import { NextRequest, NextResponse } from 'next/server';
import { extractFromDocument } from '@/lib/vision/extractor';
import type { ImageInput } from '@/lib/vision/types';

// ── Constants ──────────────────────────────────────────────────────

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
  'application/pdf',
]);

// ── POST /api/vision/extract ───────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const documentType = formData.get('documentType') as string | null;

    // ── Validate inputs ──

    if (!file) {
      return NextResponse.json(
        { error: 'file is required' },
        { status: 400 },
      );
    }

    if (!documentType) {
      return NextResponse.json(
        { error: 'documentType is required' },
        { status: 400 },
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 },
      );
    }

    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: `Unsupported file type: ${file.type}. Allowed: ${Array.from(ALLOWED_MIME_TYPES).join(', ')}` },
        { status: 400 },
      );
    }

    // ── Convert file to base64 ──

    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');

    const imageInput: ImageInput = {
      type: 'base64',
      data: base64,
      mimeType: file.type,
    };

    // ── Optional prompt context ──

    const promptOptionsRaw = formData.get('promptOptions') as string | null;
    let promptOptions: Record<string, unknown> | undefined;
    if (promptOptionsRaw) {
      try {
        promptOptions = JSON.parse(promptOptionsRaw);
      } catch {
        return NextResponse.json(
          { error: 'Invalid JSON in promptOptions field' },
          { status: 400 },
        );
      }
    }

    // ── Extract ──

    const result = await extractFromDocument(documentType, imageInput, promptOptions);

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('Vision extraction error:', error);

    // Known errors
    if (error instanceof Error && error.message.startsWith('Unknown document type')) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (error instanceof Error && error.message.includes('GEMINI_API_KEY')) {
      return NextResponse.json(
        { error: 'Vision service not configured. Contact administrator.' },
        { status: 503 },
      );
    }

    return NextResponse.json(
      { error: 'Internal server error during document extraction' },
      { status: 500 },
    );
  }
}
