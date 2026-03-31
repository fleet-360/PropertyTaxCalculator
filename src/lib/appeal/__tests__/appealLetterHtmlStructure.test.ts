import { describe, expect, it } from 'vitest';
import type { AppealUserContext } from '@/lib/appeal/buildAppealUserContext';
import type { AppealLetterGeminiPayload } from '@/lib/appeal/appealLetterPayload';
import { buildAppealLetterHtml } from '@/lib/appeal/appealLetterHtml';
import { mergeAppealLetter } from '@/lib/appeal/mergeAppealLetterDocument';

function minimalCtx(): AppealUserContext {
  return {
    fullName: 'בודק',
    city: { name: 'עיר' },
    property: { propertyNumber: '1', propertyId: '2' },
    tax: { bimonthlyPaymentReported: 100, calculationSummary: {} },
    appealNarrativeHints: [],
  };
}

describe('buildAppealLetterHtml structured rows', () => {
  it('renders heading h2 and checklist from JSON fields', () => {
    const payload: AppealLetterGeminiPayload = {
      schemaVersion: 1,
      variant: 'fallback',
      clauses: [
        { id: 't', body: 'כותרת משנה', role: 'heading', headingLevel: 2 },
        { id: 'c', body: '', items: ['שורה א', 'שורה ב'] },
      ],
    };
    const doc = mergeAppealLetter(minimalCtx(), payload, 'fallback');
    const html = buildAppealLetterHtml(doc);
    expect(html).toContain('appeal-doc-h2');
    expect(html).toContain('כותרת משנה');
    expect(html).toContain('class="checklist"');
    expect(html).toContain('שורה א');
  });

  it('renders plain block with emphasis (no template numbering)', () => {
    const payload: AppealLetterGeminiPayload = {
      schemaVersion: 1,
      variant: 'fallback',
      clauses: [{ id: '4.1', body: '4.1. תת־סעיף', emphasis: true }],
    };
    const doc = mergeAppealLetter(minimalCtx(), payload, 'fallback');
    const html = buildAppealLetterHtml(doc);
    expect(html).toContain('plain-block');
    expect(html).not.toContain('subclause-num');
    expect(html).toContain('4.1.');
    expect(html).toContain('appeal-strong');
  });
});
