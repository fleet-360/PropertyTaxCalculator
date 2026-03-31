import { NextRequest } from 'next/server';
import { verifyToken, getTokenFromRequest } from '@/lib/auth';
import { extractOrdinance } from '@/lib/vision/ordinance-extractor';
import type { OrdinanceExtractionProgress } from '@/lib/vision/ordinance-extractor';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

// ── POST /api/vision/extract-ordinance ──────────────────────────────
// Accepts a PDF file, extracts city tariff data using AI.
// Returns Server-Sent Events (SSE) stream with progress + final result.

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

  const file = formData.get('file');
  if (!file || !(file instanceof File)) {
    return new Response(JSON.stringify({ error: 'חסר קובץ PDF' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Validate file type
  if (file.type !== 'application/pdf') {
    return new Response(JSON.stringify({ error: 'נדרש קובץ PDF בלבד' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    return new Response(
      JSON.stringify({ error: `גודל הקובץ (${Math.round(file.size / 1024 / 1024)}MB) חורג מהמקסימום (50MB)` }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }

  // Convert to Buffer
  const arrayBuffer = await file.arrayBuffer();
  const pdfBuffer = Buffer.from(arrayBuffer);
  const fileName = file.name || 'ordinance.pdf';

  // Create SSE stream
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Helper to send SSE event
      const sendEvent = (event: string, payload: unknown) => {
        const chunk = `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;
        controller.enqueue(encoder.encode(chunk));
      };

      // Run extraction (non-blocking for the stream)
      (async () => {
        try {
          const onProgress = (progress: OrdinanceExtractionProgress) => {
            sendEvent('progress', progress);
          };

          const result = await extractOrdinance(pdfBuffer, fileName, onProgress);

          if (result.success) {
            sendEvent('complete', {
              success: true,
              data: result.data,
              warnings: result.warnings,
              errors: result.errors,
              processingTimeMs: result.processingTimeMs,
            });
          } else {
            sendEvent('error', {
              message: 'החילוץ הושלם חלקית או נכשל',
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
