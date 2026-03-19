import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import CityTariff from '@/lib/models/CityTariff';

// ── GET /api/cities ──────────────────────────────────────────────────
// List all active cities. Returns stripped data for UI dropdowns
// (no actual rates — just structure).
export async function GET() {
  try {
    await dbConnect();

    const cities = await CityTariff.find({ isActive: true })
      .select('cityName cityNameEn slug year availableZones types')
      .lean();

    // Strip rates from types — keep only code + label + subtypes (code + label)
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
