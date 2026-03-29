import { describe, expect, it } from 'vitest';
import { normalizeCalculationResultForLead } from '@/lib/leads/normalizeCalculationResult';

describe('normalizeCalculationResultForLead', () => {
  it('maps TaxCalculationResult fields to Lead ICalculationResult', () => {
    const api = {
      ratePerSqm: 12,
      calculatedBimonthly: 100,
      annualAfterExemption: 660,
      savingsBimonthly: 20,
      savingsAnnual: 120,
      savings10Year: 1200,
      outcome: 'overpaying' as const,
    };
    const n = normalizeCalculationResultForLead(api);
    expect(n).toEqual({
      ratePerSqm: 12,
      calculatedBimonthly: 100,
      calculatedAnnual: 660,
      savings: 20,
      savingsAnnual: 120,
      savings10Year: 1200,
      outcome: 'overpaying',
    });
  });

  it('uses calculatedBimonthly * 6 when annual missing', () => {
    const n = normalizeCalculationResultForLead({
      ratePerSqm: 1,
      calculatedBimonthly: 50,
      savingsBimonthly: 0,
      savingsAnnual: 0,
      savings10Year: 0,
      outcome: 'match',
    });
    expect(n?.calculatedAnnual).toBe(300);
  });

  it('returns undefined for bad outcome', () => {
    expect(normalizeCalculationResultForLead({ outcome: 'nope' })).toBeUndefined();
  });
});
