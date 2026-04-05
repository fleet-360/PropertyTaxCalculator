import { describe, it, expect } from 'vitest';
import { evaluateTaxBillDocumentValidation } from '@/lib/vision/tax-bill-validation';

function baseValidation(overrides: Record<string, unknown> = {}) {
  return {
    documentValidation: {
      isPropertyTaxBill: true,
      municipalityNameOnDocument: 'חיפה',
      cityMatchesSelection: true,
      ...overrides,
    },
  };
}

describe('evaluateTaxBillDocumentValidation', () => {
  it('fails when documentValidation is missing', () => {
    const r = evaluateTaxBillDocumentValidation({ fields: {} }, {});
    expect(r.ok).toBe(false);
    expect(r.warnings[0]).toMatch(/בדיקת מסמך/);
  });

  it('fails when isPropertyTaxBill is false', () => {
    const r = evaluateTaxBillDocumentValidation(
      baseValidation({ isPropertyTaxBill: false }),
      {},
    );
    expect(r.ok).toBe(false);
    expect(r.warnings[0]).toMatch(/אינו שובר/);
  });

  it('passes when bill is valid and no expected city', () => {
    const r = evaluateTaxBillDocumentValidation(
      baseValidation({ cityMatchesSelection: null }),
      {},
    );
    expect(r.ok).toBe(true);
  });

  it('fails when expected city does not match', () => {
    const r = evaluateTaxBillDocumentValidation(
      baseValidation({
        cityMatchesSelection: false,
        municipalityNameOnDocument: 'נתניה',
      }),
      { expectedCityName: 'חיפה' },
    );
    expect(r.ok).toBe(false);
    expect(r.warnings[0]).toMatch(/שובר הארנונה אינו של הרשות/);
    expect(r.warnings[0]).toMatch(/חיפה/);
    expect(r.warnings[0]).toMatch(/נתניה/);
  });

  it('passes when expected city matches', () => {
    const r = evaluateTaxBillDocumentValidation(
      baseValidation({
        cityMatchesSelection: true,
        municipalityNameOnDocument: 'חיפה',
      }),
      { expectedCityName: 'חיפה' },
    );
    expect(r.ok).toBe(true);
  });

  it('fails when expected city set but cityMatchesSelection is not true', () => {
    const r = evaluateTaxBillDocumentValidation(
      baseValidation({ cityMatchesSelection: null }),
      { expectedCityName: 'חיפה' },
    );
    expect(r.ok).toBe(false);
  });

  it('fails on malformed municipalityNameOnDocument type', () => {
    const r = evaluateTaxBillDocumentValidation(
      {
        documentValidation: {
          isPropertyTaxBill: true,
          municipalityNameOnDocument: 123,
          cityMatchesSelection: null,
        },
      },
      {},
    );
    expect(r.ok).toBe(false);
  });
});
