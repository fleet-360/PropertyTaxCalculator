import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Lead from '@/lib/models/Lead';
import { verifyToken, getTokenFromRequest } from '@/lib/auth';

// ── GET /api/leads ────────────────────────────────────────────────────
// List leads with pagination (admin only).
export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);

    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') || '20', 10)));
    const status = searchParams.get('status') || '';
    const source = searchParams.get('source') || '';
    const abandonmentStage = searchParams.get('abandonmentStage') || '';
    const city = searchParams.get('city') || '';
    const search = searchParams.get('search') || '';

    const filter: Record<string, unknown> = {};

    if (status) {
      filter.status = status;
    }
    if (source) {
      filter.source = source;
    }
    if (abandonmentStage) {
      // Filter by the latest calculation's abandonment stage
      filter['calculations.abandonmentStage'] = abandonmentStage;
    }
    if (city) {
      filter['calculations.citySlug'] = city;
    }
    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { idNumber: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;

    const [leads, total] = await Promise.all([
      Lead.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Lead.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({ leads, total, page, totalPages }, { status: 200 });
  } catch (error) {
    console.error('Error listing leads:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ── POST /api/leads ───────────────────────────────────────────────────
// Create or update a lead (public). Upsert by phone number.
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const { phone, fullName, source, email, idNumber, message, calculation } = body;

    if (!phone || !fullName || !source) {
      return NextResponse.json(
        { error: 'Validation error', details: 'phone, fullName, and source are required' },
        { status: 400 }
      );
    }

    // Try to find existing lead by phone
    const existingLead = await Lead.findOne({ phone: phone.trim() });

    if (existingLead) {
      // Update personal details
      existingLead.fullName = fullName;
      if (email !== undefined) existingLead.email = email;
      if (idNumber !== undefined) existingLead.idNumber = idNumber;
      if (message !== undefined) existingLead.message = message;

      // If calculator source, push a new calculation entry
      let calculationIndex = -1;
      if (source === 'calculator' && calculation) {
        existingLead.calculations.push({
          ...calculation,
          createdAt: new Date(),
        });
        calculationIndex = existingLead.calculations.length - 1;
      }

      await existingLead.save();

      return NextResponse.json(
        {
          lead: existingLead.toObject(),
          calculationIndex,
          isExisting: true,
        },
        { status: 200 }
      );
    }

    // Create new lead
    const leadData: Record<string, unknown> = {
      fullName,
      phone: phone.trim(),
      source,
      status: 'new',
      email,
      idNumber,
      message,
      calculations: [],
    };

    // If calculator source, add initial calculation entry
    let calculationIndex = -1;
    if (source === 'calculator' && calculation) {
      leadData.calculations = [{ ...calculation, createdAt: new Date() }];
      calculationIndex = 0;
    }

    const lead = await Lead.create(leadData);

    return NextResponse.json(
      {
        lead: lead.toObject(),
        calculationIndex,
        isExisting: false,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating/updating lead:', error);

    if (error instanceof Error && error.name === 'ValidationError') {
      return NextResponse.json(
        { error: 'Validation error', details: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
