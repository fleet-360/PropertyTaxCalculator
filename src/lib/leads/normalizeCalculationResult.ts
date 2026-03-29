import type { ICalculationResult } from '@/lib/types/customer';

const OUTCOMES = new Set(['match', 'overpaying', 'underpaying']);

/**
 * Maps API / wizard calculation payload (TaxCalculationResult) to Lead sub-document shape (ICalculationResult).
 */
export function normalizeCalculationResultForLead(
  raw: unknown,
): ICalculationResult | undefined {
  if (raw == null || typeof raw !== 'object') return undefined;

  const r = raw as Record<string, unknown>;
  const outcome = r.outcome;
  if (typeof outcome !== 'string' || !OUTCOMES.has(outcome)) {
    return undefined;
  }

  const calculatedBimonthly = num(r.calculatedBimonthly, 0);
  const calculatedAnnual = num(
    r.calculatedAnnual,
    num(r.annualAfterExemption, calculatedBimonthly * 6),
  );

  const savings = num(r.savings, num(r.savingsBimonthly, 0));
  const savingsAnnual = num(r.savingsAnnual, 0);
  const savings10Year = num(r.savings10Year, 0);
  const ratePerSqm = num(r.ratePerSqm, 0);

  return {
    ratePerSqm,
    calculatedBimonthly,
    calculatedAnnual,
    savings,
    savingsAnnual,
    savings10Year,
    outcome: outcome as ICalculationResult['outcome'],
  };
}

function num(v: unknown, fallback: number): number {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string' && v.trim() !== '' && Number.isFinite(Number(v))) return Number(v);
  return fallback;
}
