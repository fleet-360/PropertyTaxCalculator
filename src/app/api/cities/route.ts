import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import CityTariff from '@/lib/models/CityTariff';
import { verifyToken, getTokenFromRequest } from '@/lib/auth';

// ── GET /api/cities ──────────────────────────────────────────────────
// List cities. By default returns only active cities with stripped data
// for UI dropdowns. If ?all=true with admin auth, returns all cities
// with full data for admin management.
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const all = searchParams.get('all') === 'true';

    if (all) {
      // Admin: return all cities with counts (no rate stripping)
      const token = getTokenFromRequest(request);
      if (!token || !verifyToken(token)) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }

      const cities = await CityTariff.find()
        .select('cityName cityNameEn slug year isActive availableZones types ordinanceUrl createdAt updatedAt')
        .sort({ cityName: 1 })
        .lean();

      const citiesSummary = cities.map((city) => ({
        _id: city._id,
        cityName: city.cityName,
        cityNameEn: city.cityNameEn,
        slug: city.slug,
        year: city.year,
        isActive: city.isActive,
        ordinanceUrl: city.ordinanceUrl,
        zonesCount: city.availableZones?.length || 0,
        typesCount: city.types?.length || 0,
        createdAt: city.createdAt,
        updatedAt: city.updatedAt,
      }));

      return NextResponse.json({ cities: citiesSummary }, { status: 200 });
    }

    // Public: active cities only, stripped data
    const cities = await CityTariff.find({ isActive: true })
      .select('cityName cityNameEn slug year availableZones types')
      .lean();

    const stripped = cities.map((city) => ({
      _id: city._id,
      cityName: city.cityName,
      cityNameEn: city.cityNameEn,
      slug: city.slug,
      year: city.year,
      availableZones: city.availableZones,
      types: city.types.map((t) => ({
        code: t.code,
        label: t.label,
        subtypes: t.subtypes.map((s) => ({
          code: s.code,
          label: s.label,
        })),
      })),
    }));

    return NextResponse.json({ cities: stripped }, { status: 200 });
  } catch (error) {
    console.error('Error listing cities:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ── POST /api/cities ─────────────────────────────────────────────────
// Create a new city tariff (admin only).
export async function POST(request: NextRequest) {
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

    const body = await request.json();

    const city = await CityTariff.create(body);

    return NextResponse.json(city, { status: 201 });
  } catch (error) {
    console.error('Error creating city:', error);

    if (error instanceof Error && error.name === 'ValidationError') {
      return NextResponse.json(
        { error: 'Validation error', details: error.message },
        { status: 400 }
      );
    }

    if (
      error instanceof Error &&
      'code' in error &&
      (error as Record<string, unknown>).code === 11000
    ) {
      return NextResponse.json(
        { error: 'City with this slug and year already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
