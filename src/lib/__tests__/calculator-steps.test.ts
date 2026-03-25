/**
 * Comprehensive calculation steps test
 *
 * Validates EVERY intermediate value in the calculation pipeline:
 *   1. Area aggregation (main + balcony + storage + parking, correctedArea)
 *   2. Rate lookup (type → subtype → zone → sizeRange)
 *   3. Annual before exemption = totalArea × rate
 *   4. Exemption resolution (eligibility, restrictions)
 *   5. Exemption application (eligible area, discounted + full portions)
 *   6. Annual after exemption
 *   7. Bimonthly = annual / 6
 *   8. Outcome determination (match/overpaying/underpaying with 5₪ tolerance)
 *   9. Savings calculation (bimonthly, annual, 10-year)
 *  10. Property code passthrough
 */

import { describe, it, expect, beforeAll } from 'vitest';
import mongoose from 'mongoose';
import CityTariff, { ICityTariff } from '@/lib/models/CityTariff';
import {
  findRate,
  resolveExemption,
  calculatePropertyTax,
  calculateBusinessPropertyTax,
  TaxCalculationResult,
} from '@/lib/calculator';

let city: ICityTariff;

beforeAll(async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/property-tax-calculator-test';
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(uri);
  }
  const doc = await CityTariff.findOne({ slug: 'mock-city' }).lean();
  if (!doc) throw new Error('Mock city not seeded');
  city = doc as ICityTariff;
});

// ═══════════════════════════════════════════════════════════════════════
// STEP 1: Area aggregation
// ═══════════════════════════════════════════════════════════════════════

describe('Step 1: Area aggregation', () => {
  it('uses only main area when no extras provided', () => {
    const r = calculatePropertyTax(city, {
      propertyType: 'residential', subType: 'standard', zone: 'א',
      propertyAreaSqm: 80, bimonthlyPayment: 1,
    });
    expect(r.totalAreaSqm).toBe(80);
  });

  it('sums main + coveredBalcony + storage + parking', () => {
    const r = calculatePropertyTax(city, {
      propertyType: 'residential', subType: 'standard', zone: 'א',
      propertyAreaSqm: 60, coveredBalconySqm: 10, storageSqm: 5, parkingSqm: 15,
      bimonthlyPayment: 1,
    });
    expect(r.totalAreaSqm).toBe(90); // 60 + 10 + 5 + 15
  });

  it('ignores undefined extras (treats as 0)', () => {
    const r = calculatePropertyTax(city, {
      propertyType: 'residential', subType: 'standard', zone: 'א',
      propertyAreaSqm: 100, coveredBalconySqm: undefined, storageSqm: undefined,
      bimonthlyPayment: 1,
    });
    expect(r.totalAreaSqm).toBe(100);
  });

  it('uses correctedAreaSqm instead of propertyAreaSqm when provided', () => {
    const r = calculatePropertyTax(city, {
      propertyType: 'residential', subType: 'standard', zone: 'א',
      propertyAreaSqm: 100, correctedAreaSqm: 75,
      bimonthlyPayment: 1,
    });
    expect(r.totalAreaSqm).toBe(75);
  });

  it('correctedArea + extras = total', () => {
    const r = calculatePropertyTax(city, {
      propertyType: 'residential', subType: 'standard', zone: 'א',
      propertyAreaSqm: 100, correctedAreaSqm: 70, storageSqm: 10, parkingSqm: 5,
      bimonthlyPayment: 1,
    });
    expect(r.totalAreaSqm).toBe(85); // 70 + 10 + 5
  });
});

// ═══════════════════════════════════════════════════════════════════════
// STEP 2: Rate lookup
// ═══════════════════════════════════════════════════════════════════════

describe('Step 2: Rate lookup traversal', () => {
  it('direct rate: type → subtype → zone → rate', () => {
    const { rate, propertyCode } = findRate(city, 'residential', 'standard', 'ב', 80);
    expect(rate).toBe(78.5);
    expect(propertyCode).toBe('102');
  });

  it('size range: type → subtype → zone → sizeRanges → matching range', () => {
    const { rate, propertyCode } = findRate(city, 'residential', 'size_based', 'all', 75);
    expect(rate).toBe(65.0); // 61-100 range
    expect(propertyCode).toBe('121');
  });

  it('size range uses totalArea (including extras) for lookup', () => {
    // 50 sqm main + 15 storage = 65 total → falls in 61-100 range (65₪)
    const r = calculatePropertyTax(city, {
      propertyType: 'residential', subType: 'size_based', zone: 'all',
      propertyAreaSqm: 50, storageSqm: 15,
      bimonthlyPayment: 1,
    });
    expect(r.ratePerSqm).toBe(65.0); // not 40 (0-60 range)
    expect(r.totalAreaSqm).toBe(65);
  });

  it('unlimited range (-1 max) catches large values', () => {
    const { rate } = findRate(city, 'residential', 'size_based', 'all', 999);
    expect(rate).toBe(110.0); // 151+ range
  });

  it('propertyCode passes through from rate result', () => {
    const r = calculatePropertyTax(city, {
      propertyType: 'residential', subType: 'standard', zone: 'ג',
      propertyAreaSqm: 50, bimonthlyPayment: 1,
    });
    expect(r.propertyCode).toBe('103');
  });

  it('business size range with propertyCode', () => {
    const { rate, propertyCode } = findRate(city, 'business', 'retail', 'א', 25);
    expect(rate).toBe(400.0); // 0-30 range
    expect(propertyCode).toBe('301');
  });

  it('business next size range', () => {
    const { rate, propertyCode } = findRate(city, 'business', 'retail', 'א', 50);
    expect(rate).toBe(350.0); // 31-100 range
    expect(propertyCode).toBe('302');
  });
});

// ═══════════════════════════════════════════════════════════════════════
// STEP 3: Annual before exemption
// ═══════════════════════════════════════════════════════════════════════

describe('Step 3: Annual before exemption = totalArea × ratePerSqm', () => {
  it('simple multiplication', () => {
    const r = calculatePropertyTax(city, {
      propertyType: 'residential', subType: 'standard', zone: 'א',
      propertyAreaSqm: 80, bimonthlyPayment: 1,
    });
    expect(r.annualBeforeExemption).toBe(80 * 95); // 7600
  });

  it('with extras in area', () => {
    const r = calculatePropertyTax(city, {
      propertyType: 'residential', subType: 'standard', zone: 'ב',
      propertyAreaSqm: 60, coveredBalconySqm: 20, storageSqm: 10,
      bimonthlyPayment: 1,
    });
    expect(r.annualBeforeExemption).toBe(90 * 78.5); // 7065
  });

  it('large business property', () => {
    const r = calculatePropertyTax(city, {
      propertyType: 'business', subType: 'supermarket', zone: 'all',
      propertyAreaSqm: 500, bimonthlyPayment: 1,
    });
    expect(r.annualBeforeExemption).toBe(500 * 450); // 225000
  });

  it('annualBeforeExemption equals annualAfterExemption when no exemption', () => {
    const r = calculatePropertyTax(city, {
      propertyType: 'residential', subType: 'standard', zone: 'א',
      propertyAreaSqm: 80, bimonthlyPayment: 1,
    });
    expect(r.annualBeforeExemption).toBe(r.annualAfterExemption);
    expect(r.appliedExemption).toBeUndefined();
  });
});

// ═══════════════════════════════════════════════════════════════════════
// STEP 4: Exemption resolution (eligibility checks)
// ═══════════════════════════════════════════════════════════════════════

describe('Step 4: Exemption resolution', () => {
  it('resolves section and subsection metadata', () => {
    const ex = resolveExemption(city, 'senior_25');
    expect(ex).not.toBeNull();
    expect(ex!.sectionCode).toBe('1');
    expect(ex!.sectionLabel).toBe('אזרח ותיק');
    expect(ex!.subSectionCode).toBe('senior_25');
    expect(ex!.description).toContain('אזרח ותיק');
  });

  it('rejects when householdSize below minimum', () => {
    expect(resolveExemption(city, 'income_80_large', 4)).toBeNull(); // needs 5+
    expect(resolveExemption(city, 'income_80_large', 5)).not.toBeNull(); // exactly 5
    expect(resolveExemption(city, 'income_80_large', 8)).not.toBeNull(); // above min
  });

  it('rejects when childrenCount below minimum', () => {
    expect(resolveExemption(city, 'large_family_4', undefined, 3)).toBeNull(); // needs 4+
    expect(resolveExemption(city, 'large_family_4', undefined, 4)).not.toBeNull(); // exactly 4
    expect(resolveExemption(city, 'large_family_6', undefined, 5)).toBeNull(); // needs 6+
    expect(resolveExemption(city, 'large_family_6', undefined, 6)).not.toBeNull(); // exactly 6
  });

  it('exemption without restrictions always resolves', () => {
    const ex = resolveExemption(city, 'empty_100');
    expect(ex).not.toBeNull();
    expect(ex!.maxAreaSqm).toBeUndefined();
  });

  it('returns maxAreaSqm from restrictions', () => {
    expect(resolveExemption(city, 'senior_25')!.maxAreaSqm).toBe(100);
    expect(resolveExemption(city, 'disabled_80')!.maxAreaSqm).toBe(130);
    expect(resolveExemption(city, 'immigrant_90')!.maxAreaSqm).toBe(100);
  });

  it('invalid exemption code returns null (not throw)', () => {
    expect(resolveExemption(city, 'does_not_exist')).toBeNull();
    expect(resolveExemption(city, '')).toBeNull();
  });
});

// ═══════════════════════════════════════════════════════════════════════
// STEP 5: Exemption application (eligible area, discount math)
// ═══════════════════════════════════════════════════════════════════════

describe('Step 5: Exemption application', () => {
  it('full area eligible when property < maxAreaSqm', () => {
    // 80 sqm property, senior_25 maxAreaSqm=100 → all 80 eligible
    const r = calculatePropertyTax(city, {
      propertyType: 'residential', subType: 'standard', zone: 'א',
      propertyAreaSqm: 80, bimonthlyPayment: 1,
      selectedExemptionCode: 'senior_25',
    });
    expect(r.appliedExemption!.eligibleAreaSqm).toBe(80);
    // discounted: 80 × 95 × 0.75 = 5700
    expect(r.annualAfterExemption).toBe(5700);
  });

  it('partial area when property > maxAreaSqm', () => {
    // 120 sqm property, senior_25 maxAreaSqm=100 → 100 eligible, 20 full price
    const r = calculatePropertyTax(city, {
      propertyType: 'residential', subType: 'standard', zone: 'א',
      propertyAreaSqm: 120, bimonthlyPayment: 1,
      selectedExemptionCode: 'senior_25',
    });
    expect(r.appliedExemption!.eligibleAreaSqm).toBe(100);
    // discounted: 100 × 95 × 0.75 = 7125
    // full price: 20 × 95 = 1900
    // total: 9025
    expect(r.annualAfterExemption).toBe(9025);
  });

  it('100% discount → eligible portion = 0, remainder at full price', () => {
    // 70 sqm, disabled_100 maxAreaSqm=100 → all 70 eligible, 100% off
    const r = calculatePropertyTax(city, {
      propertyType: 'residential', subType: 'standard', zone: 'ג',
      propertyAreaSqm: 70, bimonthlyPayment: 1,
      selectedExemptionCode: 'disabled_100',
    });
    expect(r.appliedExemption!.eligibleAreaSqm).toBe(70);
    expect(r.appliedExemption!.discountPercent).toBe(100);
    // 70 × 55 × 0 = 0
    expect(r.annualAfterExemption).toBe(0);
  });

  it('100% discount with no area cap → entire property free', () => {
    // 200 sqm, empty_100 no maxAreaSqm → all 200 eligible
    const r = calculatePropertyTax(city, {
      propertyType: 'residential', subType: 'standard', zone: 'א',
      propertyAreaSqm: 200, bimonthlyPayment: 1,
      selectedExemptionCode: 'empty_100',
    });
    expect(r.appliedExemption!.eligibleAreaSqm).toBe(200);
    expect(r.annualAfterExemption).toBe(0);
  });

  it('100% discount with area cap, property exceeds cap', () => {
    // 150 sqm, disabled_100 maxAreaSqm=100 → 100 free, 50 full price
    const r = calculatePropertyTax(city, {
      propertyType: 'residential', subType: 'standard', zone: 'א',
      propertyAreaSqm: 150, bimonthlyPayment: 1,
      selectedExemptionCode: 'disabled_100',
    });
    expect(r.appliedExemption!.eligibleAreaSqm).toBe(100);
    // discounted: 100 × 95 × 0 = 0
    // full price: 50 × 95 = 4750
    expect(r.annualAfterExemption).toBe(4750);
  });

  it('ineligible exemption code → no exemption applied, full price', () => {
    // income_80_large needs householdSize 5+, but only 2
    const r = calculatePropertyTax(city, {
      propertyType: 'residential', subType: 'standard', zone: 'א',
      propertyAreaSqm: 80, bimonthlyPayment: 1,
      selectedExemptionCode: 'income_80_large',
      householdSize: 2,
    });
    expect(r.appliedExemption).toBeUndefined();
    expect(r.annualAfterExemption).toBe(r.annualBeforeExemption);
  });

  it('90% discount with cap: immigrant 110sqm', () => {
    // 110 sqm, immigrant_90 maxAreaSqm=100
    // eligible: 100 × 95 × 0.10 = 950
    // remainder: 10 × 95 = 950
    // total: 1900
    const r = calculatePropertyTax(city, {
      propertyType: 'residential', subType: 'standard', zone: 'א',
      propertyAreaSqm: 110, bimonthlyPayment: 1,
      selectedExemptionCode: 'immigrant_90',
    });
    expect(r.appliedExemption!.eligibleAreaSqm).toBe(100);
    expect(r.appliedExemption!.discountPercent).toBe(90);
    expect(r.annualAfterExemption).toBe(1900);
  });

  it('appliedExemption metadata is correct', () => {
    const r = calculatePropertyTax(city, {
      propertyType: 'residential', subType: 'standard', zone: 'א',
      propertyAreaSqm: 80, bimonthlyPayment: 1,
      selectedExemptionCode: 'disabled_80',
    });
    expect(r.appliedExemption).toEqual({
      sectionCode: '2',
      sectionLabel: 'נכה',
      subSectionCode: 'disabled_80',
      description: expect.stringContaining('נכה'),
      discountPercent: 80,
      eligibleAreaSqm: 80, // under 130 cap
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════
// STEP 6: Annual after exemption
// ═══════════════════════════════════════════════════════════════════════

describe('Step 6: Annual after exemption', () => {
  it('no exemption → annualAfter = annualBefore', () => {
    const r = calculatePropertyTax(city, {
      propertyType: 'residential', subType: 'standard', zone: 'א',
      propertyAreaSqm: 100, bimonthlyPayment: 1,
    });
    expect(r.annualAfterExemption).toBe(r.annualBeforeExemption);
    expect(r.annualAfterExemption).toBe(9500);
  });

  it('with exemption → annualAfter < annualBefore', () => {
    const r = calculatePropertyTax(city, {
      propertyType: 'residential', subType: 'standard', zone: 'א',
      propertyAreaSqm: 80, bimonthlyPayment: 1,
      selectedExemptionCode: 'senior_25',
    });
    expect(r.annualAfterExemption).toBeLessThan(r.annualBeforeExemption);
    expect(r.annualBeforeExemption).toBe(7600); // 80 × 95
    expect(r.annualAfterExemption).toBe(5700);  // 80 × 95 × 0.75
  });

  it('values are rounded to 2 decimal places', () => {
    // 65 × 78.5 = 5102.5 → should stay 5102.5
    const r = calculatePropertyTax(city, {
      propertyType: 'residential', subType: 'standard', zone: 'ב',
      propertyAreaSqm: 65, bimonthlyPayment: 1,
    });
    expect(r.annualBeforeExemption).toBe(5102.5);
    const decimalPlaces = r.annualBeforeExemption.toString().split('.')[1]?.length ?? 0;
    expect(decimalPlaces).toBeLessThanOrEqual(2);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// STEP 7: Bimonthly = annual / 6
// ═══════════════════════════════════════════════════════════════════════

describe('Step 7: Bimonthly calculation (annual / 6)', () => {
  it('clean division', () => {
    // 9000 / 6 = 1500 exactly
    const r = calculatePropertyTax(city, {
      propertyType: 'residential', subType: 'standard', zone: 'א',
      propertyAreaSqm: 94.74, // ~94.74 × 95 ≈ 9000.3 → rounded
      bimonthlyPayment: 1,
    });
    expect(r.calculatedBimonthly).toBe(Math.round((r.annualAfterExemption / 6) * 100) / 100);
  });

  it('bimonthly is rounded to 2 decimal places', () => {
    const r = calculatePropertyTax(city, {
      propertyType: 'residential', subType: 'standard', zone: 'א',
      propertyAreaSqm: 80, bimonthlyPayment: 1,
    });
    // 7600 / 6 = 1266.666... → 1266.67
    expect(r.calculatedBimonthly).toBe(1266.67);
    const decimalStr = r.calculatedBimonthly.toString().split('.')[1] ?? '';
    expect(decimalStr.length).toBeLessThanOrEqual(2);
  });

  it('bimonthly × 6 ≈ annual (within rounding)', () => {
    const r = calculatePropertyTax(city, {
      propertyType: 'residential', subType: 'standard', zone: 'ב',
      propertyAreaSqm: 100, bimonthlyPayment: 1,
    });
    expect(r.calculatedBimonthly * 6).toBeCloseTo(r.annualAfterExemption, 0);
  });

  it('with exemption: bimonthly based on annualAfterExemption', () => {
    const r = calculatePropertyTax(city, {
      propertyType: 'residential', subType: 'standard', zone: 'א',
      propertyAreaSqm: 80, bimonthlyPayment: 1,
      selectedExemptionCode: 'senior_25',
    });
    // annual after = 5700, bimonthly = 5700 / 6 = 950
    expect(r.calculatedBimonthly).toBe(950);
  });

  it('zero annual → zero bimonthly', () => {
    const r = calculatePropertyTax(city, {
      propertyType: 'residential', subType: 'standard', zone: 'ג',
      propertyAreaSqm: 70, bimonthlyPayment: 1,
      selectedExemptionCode: 'disabled_100',
    });
    expect(r.annualAfterExemption).toBe(0);
    expect(r.calculatedBimonthly).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// STEP 8: Outcome determination (10₪ tolerance)
// ═══════════════════════════════════════════════════════════════════════

describe('Step 8: Outcome determination', () => {
  // calculated bimonthly for 80sqm zone א = 1266.67

  it('match: reported equals calculated', () => {
    const r = calculatePropertyTax(city, {
      propertyType: 'residential', subType: 'standard', zone: 'א',
      propertyAreaSqm: 80, bimonthlyPayment: 1266.67,
    });
    expect(r.outcome).toBe('match');
  });

  it('match: within +10₪ tolerance', () => {
    const r = calculatePropertyTax(city, {
      propertyType: 'residential', subType: 'standard', zone: 'א',
      propertyAreaSqm: 80, bimonthlyPayment: 1276.67, // +10 exactly
    });
    expect(r.outcome).toBe('match');
  });

  it('match: within -10₪ tolerance', () => {
    const r = calculatePropertyTax(city, {
      propertyType: 'residential', subType: 'standard', zone: 'א',
      propertyAreaSqm: 80, bimonthlyPayment: 1256.67, // -10 exactly
    });
    expect(r.outcome).toBe('match');
  });

  it('overpaying: reported > calculated + tolerance', () => {
    const r = calculatePropertyTax(city, {
      propertyType: 'residential', subType: 'standard', zone: 'א',
      propertyAreaSqm: 80, bimonthlyPayment: 1276.68, // +10.01
    });
    expect(r.outcome).toBe('overpaying');
  });

  it('underpaying: reported < calculated - tolerance', () => {
    const r = calculatePropertyTax(city, {
      propertyType: 'residential', subType: 'standard', zone: 'א',
      propertyAreaSqm: 80, bimonthlyPayment: 1256.66, // -10.01
    });
    expect(r.outcome).toBe('underpaying');
  });

  it('overpaying: large difference', () => {
    const r = calculatePropertyTax(city, {
      propertyType: 'residential', subType: 'standard', zone: 'א',
      propertyAreaSqm: 80, bimonthlyPayment: 2000,
    });
    expect(r.outcome).toBe('overpaying');
  });

  it('underpaying: paying almost nothing', () => {
    const r = calculatePropertyTax(city, {
      propertyType: 'residential', subType: 'standard', zone: 'א',
      propertyAreaSqm: 80, bimonthlyPayment: 1,
    });
    expect(r.outcome).toBe('underpaying');
  });

  it('reportedBimonthly is stored in result', () => {
    const r = calculatePropertyTax(city, {
      propertyType: 'residential', subType: 'standard', zone: 'א',
      propertyAreaSqm: 80, bimonthlyPayment: 1500,
    });
    expect(r.reportedBimonthly).toBe(1500);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// STEP 9: Savings calculation
// ═══════════════════════════════════════════════════════════════════════

describe('Step 9: Savings calculation', () => {
  it('overpaying: savings = reported - calculated', () => {
    // calculated = 1266.67, reported = 1500
    const r = calculatePropertyTax(city, {
      propertyType: 'residential', subType: 'standard', zone: 'א',
      propertyAreaSqm: 80, bimonthlyPayment: 1500,
    });
    expect(r.savingsBimonthly).toBeCloseTo(1500 - 1266.67, 0);
    expect(r.savingsBimonthly).toBeGreaterThan(0);
  });

  it('savingsAnnual = savingsBimonthly × 6', () => {
    const r = calculatePropertyTax(city, {
      propertyType: 'residential', subType: 'standard', zone: 'א',
      propertyAreaSqm: 80, bimonthlyPayment: 1500,
    });
    expect(r.savingsAnnual).toBeCloseTo(r.savingsBimonthly * 6, 0);
  });

  it('savings10Year = savingsAnnual × 10', () => {
    const r = calculatePropertyTax(city, {
      propertyType: 'residential', subType: 'standard', zone: 'א',
      propertyAreaSqm: 80, bimonthlyPayment: 1500,
    });
    expect(r.savings10Year).toBeCloseTo(r.savingsAnnual * 10, 0);
  });

  it('underpaying: savings = 0 (not negative)', () => {
    const r = calculatePropertyTax(city, {
      propertyType: 'residential', subType: 'standard', zone: 'א',
      propertyAreaSqm: 80, bimonthlyPayment: 500,
    });
    expect(r.outcome).toBe('underpaying');
    expect(r.savingsBimonthly).toBe(0);
    expect(r.savingsAnnual).toBe(0);
    expect(r.savings10Year).toBe(0);
  });

  it('match: savings = 0', () => {
    const r = calculatePropertyTax(city, {
      propertyType: 'residential', subType: 'standard', zone: 'א',
      propertyAreaSqm: 80, bimonthlyPayment: 1266.67,
    });
    expect(r.outcome).toBe('match');
    expect(r.savingsBimonthly).toBeCloseTo(0, 0);
  });

  it('large overpayment: savings cascade correctly', () => {
    // supermarket 500sqm: 500 × 450 = 225000 / 6 = 37500
    const r = calculatePropertyTax(city, {
      propertyType: 'business', subType: 'supermarket', zone: 'all',
      propertyAreaSqm: 500, bimonthlyPayment: 50000,
    });
    const expectedSavingsBimonthly = 50000 - 37500;
    expect(r.savingsBimonthly).toBe(expectedSavingsBimonthly);
    expect(r.savingsAnnual).toBe(expectedSavingsBimonthly * 6);
    expect(r.savings10Year).toBe(expectedSavingsBimonthly * 60);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// STEP 10: Full pipeline — end-to-end scenarios
// ═══════════════════════════════════════════════════════════════════════

describe('Step 10: Full pipeline verification', () => {
  it('private residential overpaying with exemption — all steps', () => {
    // Input: 120 sqm zone א, senior_25, paying 1900
    const r = calculatePropertyTax(city, {
      propertyType: 'residential', subType: 'standard', zone: 'א',
      propertyAreaSqm: 120, bimonthlyPayment: 1900,
      selectedExemptionCode: 'senior_25',
    });

    // Step 1: area
    expect(r.totalAreaSqm).toBe(120);
    // Step 2: rate
    expect(r.ratePerSqm).toBe(95);
    expect(r.propertyCode).toBe('101');
    // Step 3: annual before
    expect(r.annualBeforeExemption).toBe(120 * 95); // 11400
    // Step 4-5: exemption (100 eligible, 20 remainder)
    expect(r.appliedExemption!.discountPercent).toBe(25);
    expect(r.appliedExemption!.eligibleAreaSqm).toBe(100);
    // Step 6: annual after = 100×95×0.75 + 20×95 = 7125 + 1900 = 9025
    expect(r.annualAfterExemption).toBe(9025);
    // Step 7: bimonthly = 9025 / 6 = 1504.17
    expect(r.calculatedBimonthly).toBeCloseTo(1504.17, 0);
    // Step 8: outcome = overpaying (1900 - 1504.17 = 395.83 > 5)
    expect(r.outcome).toBe('overpaying');
    // Step 9: savings
    expect(r.savingsBimonthly).toBeCloseTo(395.83, 0);
    expect(r.savingsAnnual).toBeCloseTo(395.83 * 6, 0);
    expect(r.savings10Year).toBeCloseTo(395.83 * 60, 0);
  });

  it('private with corrected area + extras + exemption — all steps', () => {
    // Corrected 60 sqm + 10 storage = 70 total, zone ב, disabled_80
    const r = calculatePropertyTax(city, {
      propertyType: 'residential', subType: 'standard', zone: 'ב',
      propertyAreaSqm: 90, correctedAreaSqm: 60, storageSqm: 10,
      bimonthlyPayment: 1200,
      selectedExemptionCode: 'disabled_80',
    });

    // Step 1: corrected 60 + storage 10 = 70
    expect(r.totalAreaSqm).toBe(70);
    // Step 2: rate for zone ב
    expect(r.ratePerSqm).toBe(78.5);
    // Step 3: 70 × 78.5 = 5495
    expect(r.annualBeforeExemption).toBe(5495);
    // Step 5: disabled_80, maxAreaSqm=130, property=70 → all eligible
    expect(r.appliedExemption!.eligibleAreaSqm).toBe(70);
    // Step 6: 70 × 78.5 × 0.20 = 1099
    expect(r.annualAfterExemption).toBe(1099);
    // Step 7: 1099 / 6 = 183.17
    expect(r.calculatedBimonthly).toBeCloseTo(183.17, 0);
    // Step 8: 1200 - 183.17 > 5 → overpaying
    expect(r.outcome).toBe('overpaying');
    // Step 9:
    expect(r.savingsBimonthly).toBeCloseTo(1016.83, 0);
  });

  it('business multi-designation throws error — redirect to representative', () => {
    const designations = [
      { typeCode: 'industry', subtypeCode: 'manufacturing', zone: 'ד', areaSqm: 400 },
      { typeCode: 'industry', subtypeCode: 'storage', zone: 'ד', areaSqm: 200 },
    ];
    expect(() => calculateBusinessPropertyTax(city, designations, 20000))
      .toThrow('מספר ייעודים — יש לפנות לנציג');
  });

  it('edge: exactly at tolerance boundary → match', () => {
    // calculated = 1266.67, payment = 1276.67 (diff = 10.00)
    const r = calculatePropertyTax(city, {
      propertyType: 'residential', subType: 'standard', zone: 'א',
      propertyAreaSqm: 80, bimonthlyPayment: 1276.67,
    });
    expect(r.outcome).toBe('match');
  });

  it('edge: 1 agora over tolerance → overpaying', () => {
    // calculated = 1266.67, payment = 1276.68 (diff = 10.01)
    const r = calculatePropertyTax(city, {
      propertyType: 'residential', subType: 'standard', zone: 'א',
      propertyAreaSqm: 80, bimonthlyPayment: 1276.68,
    });
    expect(r.outcome).toBe('overpaying');
  });
});
