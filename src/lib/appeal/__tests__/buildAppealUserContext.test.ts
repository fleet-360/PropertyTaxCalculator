import { describe, expect, it } from 'vitest';
import { buildAppealUserContext } from '@/lib/appeal/buildAppealUserContext';
import type { AppealGenerateRequest } from '@/lib/appeal/schemas';

describe('buildAppealUserContext', () => {
  it('maps payload to nested context', () => {
    const payload: AppealGenerateRequest = {
      fullName: 'דוגמה',
      cityName: 'חיפה',
      bimonthlyPayment: 500,
      calculationResult: { calculatedBimonthly: 400, outcome: 'overpaying' },
      idNumber: '123',
      propertyArea: 90,
    };

    const ctx = buildAppealUserContext(payload);
    expect(ctx.fullName).toBe('דוגמה');
    expect(ctx.city.name).toBe('חיפה');
    expect(ctx.tax.bimonthlyPaymentReported).toBe(500);
    expect(ctx.tax.calculationSummary.outcome).toBe('overpaying');
    expect(ctx.property.areaSqm).toBe(90);
    expect(ctx.idNumber).toBe('123');
  });
});
