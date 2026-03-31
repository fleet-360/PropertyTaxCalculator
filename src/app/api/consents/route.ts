import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import dbConnect from '@/lib/mongodb';
import ConsentRecord from '@/lib/models/ConsentRecord';
import Lead from '@/lib/models/Lead';
import { CONSENT_TEXTS } from '@/lib/consent/consentTexts';
import { verifyToken, getTokenFromRequest } from '@/lib/auth';
import type { ConsentType } from '@/lib/types/consent';
import mongoose from 'mongoose';

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp.trim();
  return 'unknown';
}

function hashText(text: string): string {
  return createHash('sha256').update(text, 'utf8').digest('hex');
}

function verifyAdmin(request: NextRequest): boolean {
  const token = getTokenFromRequest(request);
  if (!token) return false;
  return !!verifyToken(token);
}

// ── GET /api/consents ───────────────────────────────────────────────
// Fetch consent records for a lead (admin only).
export async function GET(request: NextRequest) {
  try {
    if (!verifyAdmin(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const leadId = searchParams.get('leadId');

    if (!leadId || !mongoose.Types.ObjectId.isValid(leadId)) {
      return NextResponse.json({ error: 'Valid leadId is required' }, { status: 400 });
    }

    const records = await ConsentRecord.find({ leadId: new mongoose.Types.ObjectId(leadId) })
      .sort({ timestamp: -1 })
      .lean();

    const mapped = records.map((r) => ({
      _id: String(r._id),
      consentType: r.consentType,
      consentVersion: r.consentVersion,
      accepted: r.accepted,
      ipAddress: r.ipAddress,
      userAgent: r.userAgent,
      timestamp: r.timestamp instanceof Date ? r.timestamp.toISOString() : String(r.timestamp),
    }));

    return NextResponse.json(mapped, { status: 200 });
  } catch (error) {
    console.error('Error fetching consents:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ── POST /api/consents ──────────────────────────────────────────────
// Record a new consent acceptance (public — no auth required).
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const { leadId, phone, consentType, accepted } = body as {
      leadId?: string;
      phone?: string;
      consentType?: string;
      accepted?: boolean;
    };

    // Validate required fields
    if (!phone || typeof phone !== 'string') {
      return NextResponse.json({ error: 'Phone is required' }, { status: 400 });
    }

    if (!consentType || !['data_retention', 'legal_disclaimer'].includes(consentType)) {
      return NextResponse.json({ error: 'Invalid consentType' }, { status: 400 });
    }

    if (typeof accepted !== 'boolean') {
      return NextResponse.json({ error: 'accepted must be a boolean' }, { status: 400 });
    }

    // Validate leadId format if provided
    if (leadId && !mongoose.Types.ObjectId.isValid(leadId)) {
      return NextResponse.json({ error: 'Invalid leadId format' }, { status: 400 });
    }

    // Look up consent text and version server-side (client never sends text)
    const entry = CONSENT_TEXTS[consentType as ConsentType];
    const consentTextHash = hashText(entry.text);

    const ipAddress = getClientIp(request);
    const userAgent = request.headers.get('user-agent') || 'unknown';

    const record = await ConsentRecord.create({
      leadId: leadId ? new mongoose.Types.ObjectId(leadId) : undefined,
      phone: phone.trim(),
      consentType,
      consentVersion: entry.version,
      consentTextHash,
      consentText: entry.text,
      accepted,
      ipAddress,
      userAgent,
      timestamp: new Date(),
    });

    // If leadId is provided, also update the Lead's consentTimestamp
    if (leadId) {
      await Lead.findByIdAndUpdate(leadId, {
        $set: { consentTimestamp: new Date() },
      }).catch(() => {
        // Non-blocking: consent record is saved even if lead update fails
      });
    }

    return NextResponse.json(
      { success: true, consentId: String(record._id) },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error recording consent:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ── PATCH /api/consents ─────────────────────────────────────────────
// Link orphaned consent records to a lead (called when lead is created).
export async function PATCH(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const { phone, leadId } = body as { phone?: string; leadId?: string };

    if (!phone || typeof phone !== 'string') {
      return NextResponse.json({ error: 'Phone is required' }, { status: 400 });
    }

    if (!leadId || !mongoose.Types.ObjectId.isValid(leadId)) {
      return NextResponse.json({ error: 'Valid leadId is required' }, { status: 400 });
    }

    // Update all consent records with this phone that don't yet have a leadId
    const result = await ConsentRecord.updateMany(
      { phone: phone.trim(), leadId: { $exists: false } },
      { $set: { leadId: new mongoose.Types.ObjectId(leadId) } }
    );

    return NextResponse.json(
      { success: true, linked: result.modifiedCount },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error linking consents:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
