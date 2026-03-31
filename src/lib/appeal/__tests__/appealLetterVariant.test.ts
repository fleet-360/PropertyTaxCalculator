import { describe, expect, it } from 'vitest';
import type { AppealUserContext } from '@/lib/appeal/buildAppealUserContext';
import { resolveAppealLetterVariant } from '@/lib/appeal/appealLetterVariant';

function baseCtx(over: Partial<AppealUserContext>): AppealUserContext {
  return {
    fullName: 'א',
    city: { name: 'עיר' },
    property: {},
    tax: { bimonthlyPaymentReported: 1, calculationSummary: {} },
    appealNarrativeHints: [],
    ...over,
  };
}

describe('resolveAppealLetterVariant', () => {
  it('returns area_correction when user claimed correct area', () => {
    const v = resolveAppealLetterVariant(
      baseCtx({
        property: { userClaimedCorrectTotalAreaSqm: 80 },
      }),
    );
    expect(v).toBe('area_correction');
  });

  it('returns classification_error when classification suggested', () => {
    const v = resolveAppealLetterVariant(
      baseCtx({
        property: { userSuggestedClassification: 'משרד' },
      }),
    );
    expect(v).toBe('classification_error');
  });
});
