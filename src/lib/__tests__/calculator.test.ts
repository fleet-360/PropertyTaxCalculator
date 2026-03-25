import { describe, it, expect, beforeAll } from 'vitest';
import mongoose from 'mongoose';
import CityTariff, { ICityTariff } from '@/lib/models/CityTariff';
import { findRate, findByPropertyCode, resolveExemption, resolveBestExemption, calculatePropertyTax, calculateBusinessPropertyTax } from '@/lib/calculator';
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

  it('multi-designation throws error — redirect to representative', () => {
    const designations = [
      { typeCode: 'industry', subtypeCode: 'manufacturing', zone: 'ד', areaSqm: 200 },
      { typeCode: 'industry', subtypeCode: 'storage', zone: 'ד', areaSqm: 300 },
    ];
    expect(() => calculateBusinessPropertyTax(mockCity, designations, 15000))
      .toThrow('מספר ייעודים — יש לפנות לנציג');
  });

  it('empty designations throws error', () => {
    expect(() => calculateBusinessPropertyTax(mockCity, [], 15000))
      .toThrow('לא ניתן לחשב ללא ייעודים');
  });

  it('area > 1000 throws error — redirect to representative', () => {
    expect(() => calculateBusinessPropertyTax(
      mockCity,
      [{ typeCode: 'industry', subtypeCode: 'land', zone: 'all', areaSqm: 1500 }],
      15000,
    )).toThrow('שטח מעל 1000 מ"ר — יש לפנות לנציג');
  });

  it('bimonthlyPayment < 0 throws error', () => {
    expect(() => calculateBusinessPropertyTax(
      mockCity,
      [{ typeCode: 'business', subtypeCode: 'retail', zone: 'א', areaSqm: 25 }],
      -100,
    )).toThrow('סכום התשלום חייב להיות גדול מ-0');
  });
});

// ── Progressive rate calculation ────────────────────────────────────

describe('Progressive rate calculation (size_based)', () => {
  // Brackets: 0-60@40, 61-100@65, 101-150@85, 151+@110
  // bracketEnd = max + 1, so bracket 1 covers 0..60 (61 sqm)

  it('70 sqm — crosses bracket 1→2: 61×40 + 9×65 = 3025', () => {
    const result = findRate(mockCity, 'residential', 'size_based', 'all', 70);
    expect(result.annualTotal).toBe(61 * 40 + 9 * 65); // 2440 + 585 = 3025
    expect(result.isProgressive).toBe(true);
  });

  it('120 sqm — crosses 3 brackets: 61×40 + 40×65 + 19×85 = 6655', () => {
    const result = findRate(mockCity, 'residential', 'size_based', 'all', 120);
    expect(result.annualTotal).toBe(61 * 40 + 40 * 65 + 19 * 85); // 2440 + 2600 + 1615 = 6655
    expect(result.isProgressive).toBe(true);
  });

  it('60 sqm — exactly at bracket boundary: 61×40 = 2440', () => {
    const result = findRate(mockCity, 'residential', 'size_based', 'all', 60);
    expect(result.annualTotal).toBe(60 * 40); // 2400
    expect(result.isProgressive).toBe(true);
  });

  it('61 sqm — one sqm: 61×40 = 2440', () => {
    const result = findRate(mockCity, 'residential', 'size_based', 'all', 61);
    expect(result.annualTotal).toBe(61 * 40); // 2440
    expect(result.isProgressive).toBe(true);
  });

  it('200 sqm — hits unbounded bracket: 61×40 + 40×65 + 50×85 + 49×110', () => {
    const result = findRate(mockCity, 'residential', 'size_based', 'all', 200);
    const expected = 61 * 40 + 40 * 65 + 50 * 85 + 49 * 110; // 2440+2600+4250+5390=14680
    expect(result.annualTotal).toBe(expected);
    expect(result.isProgressive).toBe(true);
  });

  it('blended rate = annualTotal / area', () => {
    const result = findRate(mockCity, 'residential', 'size_based', 'all', 70);
    expect(result.rate).toBeCloseTo(result.annualTotal / 70, 2);
  });
});

// ── findByPropertyCode ──────────────────────────────────────────────

describe('findByPropertyCode', () => {
  it('"120" → size_based range → residential/size_based/all/rate 40', () => {
    const result = findByPropertyCode(mockCity, '120');
    expect(result).not.toBeNull();
    expect(result!.typeCode).toBe('residential');
    expect(result!.subtypeCode).toBe('size_based');
    expect(result!.zoneCode).toBe('all');
    expect(result!.rate).toBe(40);
  });

  it('"101" → zone direct → residential/standard/א/rate 95', () => {
    const result = findByPropertyCode(mockCity, '101');
    expect(result).not.toBeNull();
    expect(result!.typeCode).toBe('residential');
    expect(result!.subtypeCode).toBe('standard');
    expect(result!.zoneCode).toBe('א');
    expect(result!.rate).toBe(95);
  });

  it('"999" → null (not found)', () => {
    const result = findByPropertyCode(mockCity, '999');
    expect(result).toBeNull();
  });

  it('"301" → business/retail/א/rate 400', () => {
    const result = findByPropertyCode(mockCity, '301');
    expect(result).not.toBeNull();
    expect(result!.typeCode).toBe('business');
    expect(result!.subtypeCode).toBe('retail');
    expect(result!.zoneCode).toBe('א');
    expect(result!.rate).toBe(400);
  });
});

// ── resolveBestExemption ────────────────────────────────────────────

describe('resolveBestExemption', () => {
  it('picks highest discount from multiple codes', () => {
    const result = resolveBestExemption(mockCity, ['senior_25', 'disabled_80']);
    expect(result).not.toBeNull();
    expect(result!.subSectionCode).toBe('disabled_80');
    expect(result!.discountPercent).toBe(80);
  });

  it('returns null when only code is ineligible', () => {
    const result = resolveBestExemption(mockCity, ['income_80_large'], 3);
    expect(result).toBeNull();
  });

  it('picks only eligible code when some are ineligible', () => {
    const result = resolveBestExemption(mockCity, ['income_80_large', 'senior_25'], 3);
    expect(result).not.toBeNull();
    expect(result!.subSectionCode).toBe('senior_25');
    expect(result!.discountPercent).toBe(25);
  });

  it('returns null for empty array', () => {
    const result = resolveBestExemption(mockCity, []);
    expect(result).toBeNull();
  });
});

// ── Validation edge cases ───────────────────────────────────────────

describe('Validation edge cases', () => {
  it('propertyAreaSqm = 0 → throws', () => {
    expect(() => calculatePropertyTax(mockCity, {
      propertyType: 'residential', subType: 'standard', zone: 'א',
      propertyAreaSqm: 0, bimonthlyPayment: 100,
    })).toThrow('שטח הנכס חייב להיות גדול מ-0');
  });

  it('propertyAreaSqm negative → throws', () => {
    expect(() => calculatePropertyTax(mockCity, {
      propertyType: 'residential', subType: 'standard', zone: 'א',
      propertyAreaSqm: -10, bimonthlyPayment: 100,
    })).toThrow('שטח הנכס חייב להיות גדול מ-0');
  });

  it('bimonthlyPayment negative → throws', () => {
    expect(() => calculatePropertyTax(mockCity, {
      propertyType: 'residential', subType: 'standard', zone: 'א',
      propertyAreaSqm: 80, bimonthlyPayment: -50,
    })).toThrow('סכום התשלום חייב להיות גדול מ-0');
  });

  it('correctedAreaSqm = 0 → throws', () => {
    expect(() => calculatePropertyTax(mockCity, {
      propertyType: 'residential', subType: 'standard', zone: 'א',
      propertyAreaSqm: 100, correctedAreaSqm: 0, bimonthlyPayment: 100,
    })).toThrow('שטח הנכס חייב להיות גדול מ-0');
  });

  it('correctedAreaSqm + extras = correct totalArea', () => {
    const result = calculatePropertyTax(mockCity, {
      propertyType: 'residential', subType: 'standard', zone: 'א',
      propertyAreaSqm: 100, correctedAreaSqm: 60,
      coveredBalconySqm: 10, storageSqm: 5,
      bimonthlyPayment: 1187.5, // 75×95/6
    });
    expect(result.totalAreaSqm).toBe(75); // 60 + 10 + 5
  });
});

// ── Tolerance boundary (10₪) ────────────────────────────────────────

describe('Tolerance boundary (±10₪)', () => {
  // calculated bimonthly for 80sqm zone א = 1266.67

  it('diff = +10₪ exactly → match', () => {
    const result = calculatePropertyTax(mockCity, {
      propertyType: 'residential', subType: 'standard', zone: 'א',
      propertyAreaSqm: 80, bimonthlyPayment: 1276.67,
    });
    expect(result.outcome).toBe('match');
  });

  it('diff = +10.01₪ → overpaying', () => {
    const result = calculatePropertyTax(mockCity, {
      propertyType: 'residential', subType: 'standard', zone: 'א',
      propertyAreaSqm: 80, bimonthlyPayment: 1276.68,
    });
    expect(result.outcome).toBe('overpaying');
  });

  it('diff = -10₪ exactly → match', () => {
    const result = calculatePropertyTax(mockCity, {
      propertyType: 'residential', subType: 'standard', zone: 'א',
      propertyAreaSqm: 80, bimonthlyPayment: 1256.67,
    });
    expect(result.outcome).toBe('match');
  });

  it('diff = -10.01₪ → underpaying', () => {
    const result = calculatePropertyTax(mockCity, {
      propertyType: 'residential', subType: 'standard', zone: 'א',
      propertyAreaSqm: 80, bimonthlyPayment: 1256.66,
    });
    expect(result.outcome).toBe('underpaying');
  });
});

// ── selectedExemptionCodes backward compat ──────────────────────────

describe('selectedExemptionCodes backward compat', () => {
  it('array picks best: [senior_25, disabled_80] → disabled_80', () => {
    const result = calculatePropertyTax(mockCity, {
      propertyType: 'residential', subType: 'standard', zone: 'א',
      propertyAreaSqm: 80, bimonthlyPayment: 1266.67,
      selectedExemptionCodes: ['senior_25', 'disabled_80'],
    });
    expect(result.appliedExemption).toBeDefined();
    expect(result.appliedExemption!.subSectionCode).toBe('disabled_80');
    expect(result.appliedExemption!.discountPercent).toBe(80);
  });

  it('single code (backward compat) still works', () => {
    const result = calculatePropertyTax(mockCity, {
      propertyType: 'residential', subType: 'standard', zone: 'א',
      propertyAreaSqm: 80, bimonthlyPayment: 1266.67,
      selectedExemptionCode: 'senior_25',
    });
    expect(result.appliedExemption).toBeDefined();
    expect(result.appliedExemption!.subSectionCode).toBe('senior_25');
  });
});
