import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import CityTariff from '@/lib/models/CityTariff';
import { verifyToken, getTokenFromRequest } from '@/lib/auth';
import mongoose from 'mongoose';

type RouteParams = { params: Promise<{ id: string }> };

// ── GET /api/cities/[id] ─────────────────────────────────────────────
// Get full city tariff detail by MongoDB _id or slug (public).
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    await dbConnect();

    const { id } = await params;

    // Try by ObjectId first, then by slug
    let city;
    if (mongoose.Types.ObjectId.isValid(id)) {
      city = await CityTariff.findById(id).lean();
    }

    if (!city) {
      city = await CityTariff.findOne({ slug: id }).lean();
    }

    if (!city) {
      return NextResponse.json(
        { error: 'City not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(city, { status: 200 });
  } catch (error) {
    console.error('Error fetching city:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ── PUT /api/cities/[id] ─────────────────────────────────────────────
// Update a city tariff. Requires admin authentication.
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    await dbConnect();

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid city ID format' },
        { status: 400 }
      );
    }

    const body = await request.json();

    const updatedCity = await CityTariff.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true, runValidators: true }
    ).lean();

    if (!updatedCity) {
      return NextResponse.json(
        { error: 'City not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedCity, { status: 200 });
  } catch (error) {
    console.error('Error updating city:', error);

    if (error instanceof Error && error.name === 'ValidationError') {
      return NextResponse.json(
        { error: 'Validation error', details: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ── DELETE /api/cities/[id] ──────────────────────────────────────────
// Delete a city tariff. Requires admin authentication.
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    await dbConnect();

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid city ID format' },
        { status: 400 }
      );
    }

    const deletedCity = await CityTariff.findByIdAndDelete(id);

    if (!deletedCity) {
      return NextResponse.json(
        { error: 'City not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, message: 'City tariff deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting city:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
