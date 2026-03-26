import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Lead from '@/lib/models/Lead';
import { verifyToken, getTokenFromRequest } from '@/lib/auth';
import mongoose from 'mongoose';

type RouteParams = { params: Promise<{ id: string }> };

function verifyAdmin(request: NextRequest): boolean {
  const token = getTokenFromRequest(request);
  if (!token) return false;
  return !!verifyToken(token);
}

// ── GET /api/leads/[id] ──────────────────────────────────────────────
// Get a single lead by ID (admin only).
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    if (!verifyAdmin(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid lead ID format' }, { status: 400 });
    }

    const lead = await Lead.findById(id).lean();
    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    return NextResponse.json(lead, { status: 200 });
  } catch (error) {
    console.error('Error fetching lead:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ── PUT /api/leads/[id] ──────────────────────────────────────────────
// Update a lead (public for calculator updates, admin for status changes).
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    await dbConnect();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid lead ID format' }, { status: 400 });
    }

    const body = await request.json();
    const { calculationIndex, calculationUpdate, ...leadUpdate } = body;

    // If updating a specific calculation entry
    if (calculationIndex !== undefined && calculationUpdate) {
      const setFields: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(calculationUpdate)) {
        setFields[`calculations.${calculationIndex}.${key}`] = value;
      }

      const updatedLead = await Lead.findByIdAndUpdate(
        id,
        { $set: { ...leadUpdate, ...setFields } },
        { new: true, runValidators: true }
      ).lean();

      if (!updatedLead) {
        return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
      }

      return NextResponse.json(updatedLead, { status: 200 });
    }

    // Regular lead update (admin status change, etc.)
    const updatedLead = await Lead.findByIdAndUpdate(
      id,
      { $set: leadUpdate },
      { new: true, runValidators: true }
    ).lean();

    if (!updatedLead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    return NextResponse.json(updatedLead, { status: 200 });
  } catch (error) {
    console.error('Error updating lead:', error);

    if (error instanceof Error && error.name === 'ValidationError') {
      return NextResponse.json(
        { error: 'Validation error', details: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ── DELETE /api/leads/[id] ───────────────────────────────────────────
// Delete a lead (admin only).
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    if (!verifyAdmin(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid lead ID format' }, { status: 400 });
    }

    const deletedLead = await Lead.findByIdAndDelete(id);
    if (!deletedLead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    return NextResponse.json(
      { success: true, message: 'Lead deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting lead:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
