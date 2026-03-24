import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import CityTariff from '@/lib/models/CityTariff';
import {
  calculatePropertyTax,
  calculateBusinessPropertyTax,
  type TaxCalculationInput,
} from '@/lib/calculator';

// ── POST /api/tax-rates/calculate ────────────────────────────────────
// Calculate property tax (public).
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();

    const {
      citySlug,
      propertyType,
      subType,
      zone,
      propertyAreaSqm,
      coveredBalconySqm,
      storageSqm,
      parkingSqm,
      bimonthlyPayment,
      selectedExemptionCode,
      selectedExemptionCodes,
      householdSize,
      childrenCount,
      correctedAreaSqm,
      designations,
    } = body;

    // Normalize exemption codes: support both single string and array
    const exemptionCodes: string[] = selectedExemptionCodes
      ?? (selectedExemptionCode ? [selectedExemptionCode] : []);

    // Validate required fields
    if (!citySlug) {
      return NextResponse.json(
        { error: 'citySlug is required' },
        { status: 400 }
      );
    }

    if (bimonthlyPayment === undefined || bimonthlyPayment === null) {
      return NextResponse.json(
        { error: 'bimonthlyPayment is required' },
        { status: 400 }
      );
    }

    // Load city tariff
    const tariff = await CityTariff.findOne({ slug: citySlug, isActive: true });

    if (!tariff) {
      return NextResponse.json(
        { error: `City tariff not found for slug: ${citySlug}` },
        { status: 404 }
      );
    }


    // Business with designations
    if (designations && Array.isArray(designations) && designations.length > 0) {
      const result = calculateBusinessPropertyTax(
        tariff,
        designations,
        bimonthlyPayment,
        exemptionCodes,
        householdSize,
        childrenCount
      );

      return NextResponse.json(result, { status: 200 });
    }

    // Private / standard calculation
    if (!propertyType || !subType || !zone) {
      return NextResponse.json(
        { error: 'propertyType, subType, and zone are required for standard calculation' },
        { status: 400 }
      );
    }

    if (!propertyAreaSqm && propertyAreaSqm !== 0) {
      return NextResponse.json(
        { error: 'propertyAreaSqm is required' },
        { status: 400 }
      );
    }

    const input: TaxCalculationInput = {
      propertyType,
      subType,
      zone,
      propertyAreaSqm,
      coveredBalconySqm,
      storageSqm,
      parkingSqm,
      bimonthlyPayment,
      selectedExemptionCodes: exemptionCodes,
      householdSize,
      childrenCount,
      correctedAreaSqm,
    };

    const result = calculatePropertyTax(tariff, input);

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('Error calculating tax:', error);

    // Return calculator-specific errors as 400
    if (error instanceof Error && !error.message.includes('Internal')) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
