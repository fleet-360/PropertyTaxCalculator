import { NextRequest } from 'next/server';
import { verifyToken, getTokenFromRequest } from '@/lib/auth';
import {
  extractOrdinanceSection,
  VALID_SECTION_KEYS,
} from '@/lib/vision/ordinance-extractor';
import type {
  SectionKey,
  SectionExtractionInput,
  OrdinanceExtractionProgress,
} from '@/lib/vision/ordinance-extractor';

const MAX_TOTAL_SIZE = 50 * 1024 * 1024; // 50MB total
const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/webp',
]);

// ── POST /api/vision/extract-ordinance-section ────────────────────
// Accepts file(s) + sectionKey, extracts a single section of an ordinance.
// Returns Server-Sent Events (SSE) stream with progress + result.

export async function POST(request: NextRequest) {
  // Auth check
  const token = getTokenFromRequest(request);
  if (!token || !verifyToken(token)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Parse form data
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return new Response(JSON.stringify({ error: 'בקשה לא תקינה — נדרש FormData' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Validate sectionKey
  const sectionKey = formData.get('sectionKey') as string | null;
  if (!sectionKey || !VALID_SECTION_KEYS.has(sectionKey)) {
    return new Response(
      JSON.stringify({ error: `sectionKey לא תקין. ערכים אפשריים: ${[...VALID_SECTION_KEYS].join(', ')}` }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }

  // Collect all files
  const files = formData.getAll('file').filter((f): f is File => f instanceof File);
  if (files.length === 0) {
    return new Response(JSON.stringify({ error: 'לא סופקו קבצים' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Validate file types and total size
  let totalSize = 0;
  for (const file of files) {
    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return new Response(
        JSON.stringify({ error: `סוג קובץ לא נתמך: ${file.type}. נתמכים: PDF, PNG, JPEG, WebP` }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }
    totalSize += file.size;
  }

  if (totalSize > MAX_TOTAL_SIZE) {
    return new Response(
      JSON.stringify({ error: `גודל הקבצים (${Math.round(totalSize / 1024 / 1024)}MB) חורג מהמקסימום (50MB)` }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }

  // Parse optional context
  let context: SectionExtractionInput['context'];
  const contextStr = formData.get('context') as string | null;
  if (contextStr) {
    try {
      context = JSON.parse(contextStr);
    } catch {
      return new Response(JSON.stringify({ error: 'context JSON לא תקין' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  // Validate rates requires zones
  if (sectionKey === 'rates') {
    if (!context?.availableZones || context.availableZones.length === 0) {
      return new Response(
        JSON.stringify({ error: 'חילוץ תעריפים דורש רשימת אזורים (context.availableZones)' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }
  }

  // Optional custom prompt
  const customPrompt = (formData.get('customPrompt') as string | null) || undefined;

  // Convert files to buffers
  const fileBuffers: SectionExtractionInput['fileBuffers'] = [];
  for (const file of files) {
    const arrayBuffer = await file.arrayBuffer();
    fileBuffers.push({
      buffer: Buffer.from(arrayBuffer),
      mimeType: file.type,
    });
  }

  const fileName = files[0].name || 'section-extract';

  // Create SSE stream
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const sendEvent = (event: string, payload: unknown) => {
        const chunk = `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;
        controller.enqueue(encoder.encode(chunk));
      };

      (async () => {
        try {
          const onProgress = (progress: OrdinanceExtractionProgress) => {
            sendEvent('progress', progress);
          };

          const result = await extractOrdinanceSection(
            {
              sectionKey: sectionKey as SectionKey,
              fileBuffers,
              fileName,
              context,
              customPrompt,
            },
            onProgress,
          );

          if (result.success) {
            sendEvent('complete', {
              success: true,
              sectionKey: result.sectionKey,
              data: result.data,
              warnings: result.warnings,
              errors: result.errors,
              processingTimeMs: result.processingTimeMs,
            });
          } else {
            sendEvent('error', {
              message: 'החילוץ נכשל או הושלם חלקית',
              sectionKey: result.sectionKey,
              partialData: result.data,
              warnings: result.warnings,
              errors: result.errors,
              processingTimeMs: result.processingTimeMs,
            });
          }
        } catch (error) {
          sendEvent('error', {
            message: error instanceof Error ? error.message : 'שגיאה לא צפויה בתהליך החילוץ',
          });
        } finally {
          controller.close();
        }
      })();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
