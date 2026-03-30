import { describe, expect, it } from 'vitest';
import { buildAppealUserContext } from '@/lib/appeal/buildAppealUserContext';
import type { AppealGenerateRequest } from '@/lib/appeal/schemas';

describe('buildAppealUserContext', () => {
  it('maps payload to nested context', () => {
    const payload = {
      fullName: 'דוגמה',
      cityName: 'חיפה',
      bimonthlyPayment: 500,
      calculationResult: { calculatedBimonthly: 400, outcome: 'overpaying' },
      idNumber: '123',
      propertyArea: 90,
    } as unknown as AppealGenerateRequest;

    const ctx = buildAppealUserContext(payload);
    expect(ctx.fullName).toBe('דוגמה');
    expect(ctx.city.name).toBe('חיפה');
    expect(ctx.tax.bimonthlyPaymentReported).toBe(500);
    expect(ctx.tax.calculationSummary.outcome).toBe('overpaying');
    expect(ctx.property.areaSqm).toBe(90);
    expect(ctx.idNumber).toBe('123');
    expect(ctx.appealNarrativeHints.length).toBeGreaterThan(0);
    expect(ctx.appealNarrativeHints.some((h) => h.includes('overpaying'))).toBe(true);
  });

  it('maps disputes and partial areas for template selection', () => {
    const payload = {
      fullName: 'בדיקה',
      cityName: 'תל אביב',
      bimonthlyPayment: 400,
      calculationResult: { outcome: 'match' },
      measurementError: { claimed: 85 },
      classificationError: { suggested: 'מחסן' },
      propertyPurpose: 'הנכס ריק',
      coveredBalconyArea: 12,
      block: '6400',
      parcel: '115',
    } as unknown as AppealGenerateRequest;

    const ctx = buildAppealUserContext(payload);
    expect(ctx.property.userClaimedCorrectTotalAreaSqm).toBe(85);
    expect(ctx.property.userSuggestedClassification).toBe('מחסן');
    expect(ctx.property.statedPurpose).toBe('הנכס ריק');
    expect(ctx.property.partialAreas?.coveredBalconySqm).toBe(12);
    expect(ctx.property.cadastral?.block).toBe('6400');
    expect(ctx.property.cadastral?.parcel).toBe('115');
    expect(ctx.appealNarrativeHints.some((h) => h.includes('Area correction'))).toBe(true);
    expect(ctx.appealNarrativeHints.some((h) => h.includes('Classification correction'))).toBe(true);
  });
});
