import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';
import CityTariff from '@/lib/models/CityTariff';
import { fetchVercelBlobOrdinance, isVercelBlobPublicUrl } from '@/lib/ordinancePdf';

type RouteParams = { params: Promise<{ id: string }> };

function fileNameFromOrdinanceUrl(ordinanceUrl: string): string {
  try {
    const path = new URL(ordinanceUrl).pathname;
    const base = path.split('/').pop() ?? '';
    if (base && base.includes('.')) return base;
  } catch {
    const segment = ordinanceUrl.split('/').pop()?.split('?')[0];
    if (segment && segment.includes('.')) return segment;
  }
  return 'ordinance.pdf';
}

function contentDisposition(
  fileName: string,
  mode: 'inline' | 'attachment',
): string {
  const safe = fileName.replace(/[\r\n"]/g, '_');
  const encoded = encodeURIComponent(fileName).replace(/'/g, '%27');
  return `${mode}; filename="${safe}"; filename*=UTF-8''${encoded}`;
}

// ── GET /api/view-pdf/[id] ───────────────────────────────────────────
// Streams ordinance PDF from DB URL (slug or Mongo id). Query: ?download=1 → attachment.
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await dbConnect();

    const { id } = await params;
    if (!id?.trim()) {
      return NextResponse.json({ error: 'City not found' }, { status: 404 });
    }

    let city;
    if (mongoose.Types.ObjectId.isValid(id)) {
      city = await CityTariff.findById(id).select('ordinanceUrl').lean();
    }
    if (!city) {
      city = await CityTariff.findOne({ slug: id }).select('ordinanceUrl').lean();
    }

    if (!city) {
      return NextResponse.json({ error: 'City not found' }, { status: 404 });
    }

    const ordinanceUrl = (city as { ordinanceUrl?: string }).ordinanceUrl?.trim();
    if (!ordinanceUrl) {
      return NextResponse.json({ error: 'Ordinance not available' }, { status: 404 });
    }

    const download = request.nextUrl.searchParams.get('download') === '1';
    const dispositionMode = download ? 'attachment' : 'inline';
    const baseName = fileNameFromOrdinanceUrl(ordinanceUrl);

    if (ordinanceUrl.startsWith('/')) {
      const origin = request.nextUrl.origin;
      const absolute = `${origin}${ordinanceUrl}`;
      if (!download) {
        return NextResponse.redirect(absolute);
      }
      const local = await fetch(absolute);
      if (!local.ok) {
        return NextResponse.json(
          { error: 'Failed to load ordinance document' },
          { status: local.status >= 400 && local.status < 600 ? local.status : 502 },
        );
      }
      const contentType =
        local.headers.get('content-type')?.split(';')[0]?.trim() || 'application/pdf';
      const outHeaders = new Headers();
      outHeaders.set('Content-Type', contentType);
      outHeaders.set('Content-Disposition', contentDisposition(baseName, 'attachment'));
      const len = local.headers.get('content-length');
      if (len) outHeaders.set('Content-Length', len);
      if (!local.body) {
        return NextResponse.json({ error: 'Empty response' }, { status: 502 });
      }
      return new NextResponse(local.body, { status: 200, headers: outHeaders });
    }

    if (!ordinanceUrl.startsWith('http://') && !ordinanceUrl.startsWith('https://')) {
      return NextResponse.json({ error: 'Invalid ordinance URL' }, { status: 500 });
    }

    if (isVercelBlobPublicUrl(ordinanceUrl)) {
      try {
        const blob = await fetchVercelBlobOrdinance(ordinanceUrl);
        if (!blob) {
          return NextResponse.json(
            { error: 'Failed to load ordinance document' },
            { status: 404 },
          );
        }
        const outHeaders = new Headers();
        outHeaders.set('Content-Type', blob.contentType);
        outHeaders.set('Content-Disposition', contentDisposition(baseName, dispositionMode));
        if (blob.size > 0) {
          outHeaders.set('Content-Length', String(blob.size));
        }
        return new NextResponse(blob.stream, { status: 200, headers: outHeaders });
      } catch (err) {
        console.error('Vercel Blob get (ordinance):', err);
        return NextResponse.json(
          { error: 'Failed to load ordinance document' },
          { status: 502 },
        );
      }
    }

    const upstream = await fetch(ordinanceUrl);

    if (!upstream.ok) {
      return NextResponse.json(
        { error: 'Failed to load ordinance document' },
        { status: upstream.status >= 400 && upstream.status < 600 ? upstream.status : 502 },
      );
    }

    const contentType =
      upstream.headers.get('content-type')?.split(';')[0]?.trim() || 'application/pdf';

    const outHeaders = new Headers();
    outHeaders.set('Content-Type', contentType);
    outHeaders.set('Content-Disposition', contentDisposition(baseName, dispositionMode));

    const len = upstream.headers.get('content-length');
    if (len) {
      outHeaders.set('Content-Length', len);
    }

    if (!upstream.body) {
      return NextResponse.json({ error: 'Empty response' }, { status: 502 });
    }

    return new NextResponse(upstream.body, { status: 200, headers: outHeaders });
  } catch (error) {
    console.error('GET /api/view-pdf/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
