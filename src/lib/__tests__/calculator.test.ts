import { describe, it, expect, beforeAll } from 'vitest';
import mongoose from 'mongoose';
import CityTariff, { ICityTariff } from '@/lib/models/CityTariff';
import { findRate, resolveExemption, calculatePropertyTax, calculateBusinessPropertyTax } from '@/lib/calculator';
import { allScenarios, residentialScenarios, exemptionScenarios, businessScenarios } from '@/data/mock-city-scenarios';

let mockCity: ICityTariff;

beforeAll(async () => {
  // Connect to test DB
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/property-tax-calculator-test';
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(uri);
  }
  const city = await CityTariff.findOne({ slug: 'mock-city' }).lean();
  if (!city) throw new Error('Mock city not found in DB. Run seed first.');
  mockCity = city as ICityTariff;
});

// ── findRate ───────────────────────────────────────────────────────────

describe('findRate', () => {
  it('direct rate: residential/standard/zone א/80sqm → rate 95.00', () => {
    const result = findRate(mockCity, 'residential', 'standard', 'א', 80);
    expect(result.rate).toBe(95.0);
  });

  it('different zone: residential/standard/zone ג/70sqm → rate 55.00', () => {
    const result = findRate(mockCity, 'residential', 'standard', 'ג', 70);
    expect(result.rate).toBe(55.0);
  });

  it('luxury subtype: residential/luxury/zone א/160sqm → rate 130.00', () => {
    const result = findRate(mockCity, 'residential', 'luxury', 'א', 160);
    expect(result.rate).toBe(130.0);
  });

  it('size range small (0-60): residential/size_based/all/50sqm → rate 40.00', () => {
    const result = findRate(mockCity, 'residential', 'size_based', 'all', 50);
    expect(result.rate).toBe(40.0);
  });

  it('size range medium (61-100): residential/size_based/all/80sqm → rate 65.00', () => {
    const result = findRate(mockCity, 'residential', 'size_based', 'all', 80);
    expect(result.rate).toBe(65.0);
  });

  it('size range large (151+): residential/size_based/all/200sqm → rate 110.00', () => {
    const result = findRate(mockCity, 'residential', 'size_based', 'all', 200);
    expect(result.rate).toBe(110.0);
  });

  it('boundary max: industry/manufacturing/zone ד/500sqm → rate 180.00', () => {
    const result = findRate(mockCity, 'industry', 'manufacturing', 'ד', 500);
    expect(result.rate).toBe(180.0);
  });

  it('boundary min next: industry/manufacturing/zone ד/501sqm → rate 150.00', () => {
    const result = findRate(mockCity, 'industry', 'manufacturing', 'ד', 501);
    expect(result.rate).toBe(150.0);
  });

  it('business multi-zone: business/retail/zone ב/50sqm → rate 270.00', () => {
    const result = findRate(mockCity, 'business', 'retail', 'ב', 50);
    expect(result.rate).toBe(270.0);
  });

  it('flat rate: business/supermarket/all/800sqm → rate 450.00', () => {
    const result = findRate(mockCity, 'business', 'supermarket', 'all', 800);
    expect(result.rate).toBe(450.0);
  });

  it('error: invalid property type throws', () => {
    expect(() => findRate(mockCity, 'nonexistent', 'standard', 'א', 80)).toThrow();
  });

  it('error: invalid zone throws', () => {
    expect(() => findRate(mockCity, 'residential', 'standard', 'zzz', 80)).toThrow();
  });
});

// ── resolveExemption ──────────────────────────────────────────────────

describe('resolveExemption', () => {
  it('senior_25 → discountPercent 25, maxAreaSqm 100', () => {
    const result = resolveExemption(mockCity, 'senior_25');
    expect(result).not.toBeNull();
    expect(result!.discountPercent).toBe(25);
    expect(result!.maxAreaSqm).toBe(100);
  });

  it('disabled_80 → discountPercent 80, maxAreaSqm 130', () => {
    const result = resolveExemption(mockCity, 'disabled_80');
    expect(result).not.toBeNull();
    expect(result!.discountPercent).toBe(80);
    expect(result!.maxAreaSqm).toBe(130);
  });

  it('income_80_small with householdSize 3 → eligible, discountPercent 80', () => {
    const result = resolveExemption(mockCity, 'income_80_small', 3);
    expect(result).not.toBeNull();
    expect(result!.discountPercent).toBe(80);
  });

  it('income_80_large with householdSize 3 → null (needs 5+)', () => {
    const result = resolveExemption(mockCity, 'income_80_large', 3);
    expect(result).toBeNull();
  });

  it('large_family_4 with childrenCount 5 → eligible, discountPercent 20', () => {
    const result = resolveExemption(mockCity, 'large_family_4', undefined, 5);
    expect(result).not.toBeNull();
    expect(result!.discountPercent).toBe(20);
  });

  it('large_family_6 with childrenCount 4 → null (needs 6+)', () => {
    const result = resolveExemption(mockCity, 'large_family_6', undefined, 4);
    expect(result).toBeNull();
  });

  it('empty_100 → discountPercent 100, no maxAreaSqm', () => {
    const result = resolveExemption(mockCity, 'empty_100');
    expect(result).not.toBeNull();
    expect(result!.discountPercent).toBe(100);
    expect(result!.maxAreaSqm).toBeUndefined();
  });

  it('nonexistent code → null', () => {
    const result = resolveExemption(mockCity, 'nonexistent_code');
    expect(result).toBeNull();
  });
});

// ── calculatePropertyTax ──────────────────────────────────────────────

describe('calculatePropertyTax', () => {
  const scenarios = [...residentialScenarios, ...exemptionScenarios];

  scenarios.forEach((scenario) => {
    it(scenario.name, () => {
      const result = calculatePropertyTax(mockCity, scenario.input);
      expect(result.ratePerSqm).toBe(scenario.expected.ratePerSqm);
      expect(result.totalAreaSqm).toBe(scenario.expected.totalAreaSqm);
      expect(result.outcome).toBe(scenario.expected.outcome);
      expect(result.calculatedBimonthly).toBeCloseTo(scenario.expected.calculatedBimonthly, 0);
      // Use toBeCloseTo with precision 0 (within 1 shekel) to handle rounding
    });
  });
});

// ── calculateBusinessPropertyTax ──────────────────────────────────────

describe('calculateBusinessPropertyTax', () => {
  it('single shop: retail zone א 25sqm, bimonthly 1800 → overpaying', () => {
    const result = calculateBusinessPropertyTax(
      mockCity,
      [{ typeCode: 'business', subtypeCode: 'retail', zone: 'א', areaSqm: 25 }],
      1800,
    );
    // 25 × 400 = 10000 / 6 = 1666.67
    expect(result.ratePerSqm).toBe(400);
    expect(result.totalAreaSqm).toBe(25);
    expect(result.calculatedBimonthly).toBeCloseTo(1666.67, 0);
    expect(result.outcome).toBe('overpaying');
  });

  it('single storage: industry/storage zone ד 300sqm, bimonthly 4000 → match', () => {
    const result = calculateBusinessPropertyTax(
      mockCity,
      [{ typeCode: 'industry', subtypeCode: 'storage', zone: 'ד', areaSqm: 300 }],
      4000,
    );
    // 300 × 80 = 24000 / 6 = 4000
    expect(result.ratePerSqm).toBe(80);
    expect(result.totalAreaSqm).toBe(300);
    expect(result.calculatedBimonthly).toBeCloseTo(4000, 0);
    expect(result.outcome).toBe('match');
  });

  it('multi-designation: manufacturing 200sqm + storage 300sqm + land 500sqm', () => {
    const designations = [
      { typeCode: 'industry', subtypeCode: 'manufacturing', zone: 'ד', areaSqm: 200 },
      { typeCode: 'industry', subtypeCode: 'storage', zone: 'ד', areaSqm: 300 },
      { typeCode: 'industry', subtypeCode: 'land', zone: 'all', areaSqm: 500 },
    ];
    // manufacturing 200 × 180 = 36000
    // storage 300 × 80 = 24000
    // land 500 × 22 = 11000
    // total annual = 71000 / 6 = 11833.33
    const expectedBimonthly = Math.round((71000 / 6) * 100) / 100;

    const result = calculateBusinessPropertyTax(mockCity, designations, expectedBimonthly);
    expect(result.totalAreaSqm).toBe(1000);
    expect(result.calculatedBimonthly).toBeCloseTo(expectedBimonthly, 0);
    expect(result.outcome).toBe('match');
  });

  it('multi-designation with disabled_40 exemption: verify discount applied', () => {
    const designations = [
      { typeCode: 'industry', subtypeCode: 'manufacturing', zone: 'ד', areaSqm: 200 },
      { typeCode: 'industry', subtypeCode: 'storage', zone: 'ד', areaSqm: 300 },
    ];
    // manufacturing 200 × 180 = 36000
    // storage 300 × 80 = 24000
    // total annual before = 60000
    // disabled_40: 40% discount, maxAreaSqm 100
    // eligibleArea = min(500, 100) = 100
    // discountRatio = 100 / 500 = 0.2
    // annualAfter = 60000 × (1 - 0.40 × 0.2) = 60000 × 0.92 = 55200
    // bimonthly = 55200 / 6 = 9200
    const result = calculateBusinessPropertyTax(
      mockCity,
      designations,
      15000, // overpaying
      'disabled_40',
    );
    expect(result.appliedExemption).toBeDefined();
    expect(result.appliedExemption!.discountPercent).toBe(40);
    expect(result.appliedExemption!.eligibleAreaSqm).toBe(100);
    expect(result.calculatedBimonthly).toBeCloseTo(9200, 0);
    expect(result.outcome).toBe('overpaying');
  });
});
