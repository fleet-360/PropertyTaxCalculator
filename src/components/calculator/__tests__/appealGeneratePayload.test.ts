import { describe, expect, it } from 'vitest';
import {
  buildAppealGeneratePayload,
  withMeasurementErrorClaimed,
} from '@/components/calculator/appealGeneratePayload';
import type { WizardState } from '@/components/calculator/CalculatorWizard';
import { initialState } from '@/components/calculator/CalculatorWizard';

function minimalState(over: Partial<WizardState>): WizardState {
  return {
    ...initialState,
    fullName: 'Test User',
    citySlug: 'mock-city',
    bimonthlyPayment: 100,
    ...over,
  };
}

describe('withMeasurementErrorClaimed', () => {
  it('adds measurementError when claimed is positive', () => {
    const base = buildAppealGeneratePayload(
      minimalState({ propertyArea: 100, measurementError: null }),
    );
    const out = withMeasurementErrorClaimed(base, 80);
    expect(out.measurementError).toEqual({ claimed: 80, attachment: undefined });
  });

  it('preserves attachment from base payload', () => {
    const base = buildAppealGeneratePayload(
      minimalState({
        measurementError: { claimed: 50, attachment: 'https://example.com/x' },
      }),
    );
    const out = withMeasurementErrorClaimed(base, 80);
    expect(out.measurementError).toEqual({ claimed: 80, attachment: 'https://example.com/x' });
  });

  it('returns same object when claimed is invalid', () => {
    const base = buildAppealGeneratePayload(minimalState({}));
    expect(withMeasurementErrorClaimed(base, 0)).toBe(base);
    expect(withMeasurementErrorClaimed(base, -1)).toBe(base);
  });
});
