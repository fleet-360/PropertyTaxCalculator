import { describe, expect, it } from 'vitest';
import type { AppealUserContext } from '@/lib/appeal/buildAppealUserContext';
import type { AppealLetterGeminiPayload } from '@/lib/appeal/appealLetterPayload';
import {
  APPEAL_LETTER_DISTRIBUTION_LINE,
  mergeAppealLetter,
  mergeAreaCorrectionLetter,
} from '@/lib/appeal/mergeAppealLetterDocument';

function minimalFallbackContext(): AppealUserContext {
  return {
    fullName: 'דוגמה',
    idNumber: '111111111',
    city: { name: 'תל אביב' },
    address: "רח' בן גוריון 1",
    property: {
      areaSqm: 70,
      propertyNumber: '1',
      propertyId: '2',
      subType: 'דירה',
      cadastral: { block: '10', parcel: '20' },
    },
    tax: { bimonthlyPaymentReported: 800, calculationSummary: {} },
    appealNarrativeHints: [],
  };
}

function minimalAreaCorrectionContext(): AppealUserContext {
  return {
    fullName: 'ישראל ישראלי',
    idNumber: '123456789',
    city: { name: 'חיפה' },
    address: "רח' הרצל 1",
    property: {
      areaSqm: 100,
      userClaimedCorrectTotalAreaSqm: 80,
      subType: 'דירה',
      propertyNumber: '999',
      propertyId: '888',
      cadastral: { block: '1', parcel: '2' },
    },
    tax: {
      bimonthlyPaymentReported: 1500,
      calculationSummary: { ratePerSqmAnnual: 95 },
    },
    appealNarrativeHints: [],
  };
}

describe('mergeAppealLetter', () => {
  it('uses same date/signature meta as area_correction for fallback variant', () => {
    const ctx = minimalFallbackContext();
    const payload: AppealLetterGeminiPayload = {
      schemaVersion: 1,
      variant: 'fallback',
      clauses: [],
    };
    const doc = mergeAppealLetter(ctx, payload, 'fallback');
    expect(doc.variant).toBe('fallback');
    expect(doc.showSignaturePlaceholder).toBe(true);
    expect(doc.distributionLine).toBe(APPEAL_LETTER_DISTRIBUTION_LINE);
    expect(doc.signerNameLine).toBe('דוגמה');
    expect(doc.dateLine).toMatch(/^תאריך:/);

    const areaPayload: AppealLetterGeminiPayload = {
      schemaVersion: 1,
      variant: 'area_correction',
      clauses: [],
    };
    const areaCtx = minimalAreaCorrectionContext();
    const areaDoc = mergeAppealLetter(areaCtx, areaPayload, 'area_correction');
    expect(doc.dateLine).toMatch(/^תאריך:/);
    expect(areaDoc.showSignaturePlaceholder).toBe(doc.showSignaturePlaceholder);
    expect(areaDoc.distributionLine).toBe(APPEAL_LETTER_DISTRIBUTION_LINE);
    expect(areaDoc.signerNameLine).toBe('ישראל ישראלי');
  });

  it('strips trailing Gemini clause that duplicates the server distribution line', () => {
    const ctx = minimalFallbackContext();
    const payload: AppealLetterGeminiPayload = {
      schemaVersion: 1,
      variant: 'fallback',
      clauses: [
        { id: '1', body: 'גוף המכתב.' },
        { id: '99', body: 'העתק: ועדת הנחות בארנונה / גזבר העירייה' },
      ],
    };
    const doc = mergeAppealLetter(ctx, payload, 'fallback');
    expect(doc.bodyRows.filter((r) => r.type === 'plain')).toHaveLength(1);
    expect((doc.bodyRows[0] as { text: string }).text).toContain('גוף המכתב');
    expect(doc.distributionLine).toBe(APPEAL_LETTER_DISTRIBUTION_LINE);
  });
});

describe('mergeAreaCorrectionLetter', () => {
  it('uses generic fallback clause when clauses array is empty', () => {
    const ctx = minimalAreaCorrectionContext();
    const payload: AppealLetterGeminiPayload = {
      schemaVersion: 1,
      variant: 'area_correction',
      clauses: [],
    };
    const doc = mergeAreaCorrectionLetter(ctx, payload);
    expect(doc.variant).toBe('area_correction');
    expect(doc.header.fullName).toBe('ישראל ישראלי');
    expect(doc.dateLine).toMatch(/^תאריך:/);
    expect(doc.bodyRows.some((r) => r.type === 'date')).toBe(false);
    expect(doc.bodyRows).toHaveLength(1);
    expect(doc.bodyRows[0]).toMatchObject({ type: 'plain' });
  });

  it('applies Gemini clause override for a numbered clause', () => {
    const ctx = minimalAreaCorrectionContext();
    const payload: AppealLetterGeminiPayload = {
      schemaVersion: 1,
      variant: 'area_correction',
      clauses: [{ id: '1', body: 'טקסט מותאם אישית לסעיף 1.' }],
    };
    const doc = mergeAreaCorrectionLetter(ctx, payload);
    const p1 = doc.bodyRows.find((r) => r.type === 'plain');
    expect(p1 && 'text' in p1 && p1.text).toContain('טקסט מותאם');
  });
});
