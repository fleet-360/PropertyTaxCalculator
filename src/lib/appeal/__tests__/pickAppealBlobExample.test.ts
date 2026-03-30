import { describe, expect, it } from 'vitest';
import type { BlobBackedGeminiSource } from '@/lib/gemini/resolveBlobToGeminiFile';
import type { AppealUserContext } from '@/lib/appeal/buildAppealUserContext';
import { pickAppealBlobExamplesForGemini } from '@/lib/appeal/pickAppealBlobExample';

function src(pathSuffix: string): BlobBackedGeminiSource {
  return {
    displayName: `blob-sample:Sample documents/${pathSuffix}`,
    blobUrl: `https://example.com/${pathSuffix}`,
  };
}

const baseCtx = (): AppealUserContext => ({
  fullName: 'א',
  city: { name: 'חיפה' },
  property: {},
  tax: { bimonthlyPaymentReported: 1, calculationSummary: {} },
  appealNarrativeHints: [],
});

describe('pickAppealBlobExamplesForGemini', () => {
  it('returns empty when no sources', () => {
    expect(pickAppealBlobExamplesForGemini([], baseCtx())).toEqual([]);
  });

  it('picks תיקון שטחים when user claimed area', () => {
    const sources = [
      src('דוגמה להשגה טעות בסיווג השטחים.pdf'),
      src('דוגמה להשגה לתיקון שטחים.pdf'),
    ];
    const ctx = baseCtx();
    ctx.property.userClaimedCorrectTotalAreaSqm = 80;
    const out = pickAppealBlobExamplesForGemini(sources, ctx);
    expect(out).toHaveLength(1);
    expect(out[0]!.displayName).toContain('תיקון שטחים');
  });

  it('picks טעות בסיווג when classification suggested', () => {
    const sources = [
      src('דוגמה להשגה לתיקון שטחים.pdf'),
      src('דוגמה להשגה טעות בסיווג השטחים.pdf'),
    ];
    const ctx = baseCtx();
    ctx.property.userSuggestedClassification = 'מחסן';
    const out = pickAppealBlobExamplesForGemini(sources, ctx);
    expect(out).toHaveLength(1);
    expect(out[0]!.displayName).toContain('סיווג');
  });

  it('picks נכס ריק by exemption label', () => {
    const sources = [
      src('דוגמא להשגה להחלת פטורים כלליים.pdf'),
      src('דוגמה להשגה לנכס ריק.pdf'),
    ];
    const ctx = baseCtx();
    ctx.exemptions = [{ label: 'נכס ריק לפי צו' }];
    const out = pickAppealBlobExamplesForGemini(sources, ctx);
    expect(out[0]!.displayName).toContain('נכס ריק');
  });

  it('picks נכס ריק for דירה ריקה (no word נכס in label)', () => {
    const sources = [
      src('דוגמא להשגה להחלת פטורים כלליים.pdf'),
      src('דוגמה להשגה לנכס ריק.pdf'),
    ];
    const ctx = baseCtx();
    ctx.exemptions = [{ label: 'פטור בגין דירה ריקה' }];
    const out = pickAppealBlobExamplesForGemini(sources, ctx);
    expect(out[0]!.displayName).toContain('נכס ריק');
  });

  it('picks נכס ריק from statedPurpose when exemptions omit ריק wording', () => {
    const sources = [
      src('דוגמא להשגה להחלת פטורים כלליים.pdf'),
      src('דוגמה להשגה לנכס ריק.pdf'),
    ];
    const ctx = baseCtx();
    ctx.exemptions = [{ label: 'הנחה כללית' }];
    ctx.property.statedPurpose = 'הנכס עומד ריק';
    const out = pickAppealBlobExamplesForGemini(sources, ctx);
    expect(out[0]!.displayName).toContain('נכס ריק');
  });

  it('prefers נכס ריק over פטורים כלליים when hay mentions both', () => {
    const sources = [
      src('דוגמא להשגה להחלת פטורים כלליים.pdf'),
      src('דוגמה להשגה לנכס ריק.pdf'),
    ];
    const ctx = baseCtx();
    ctx.exemptions = [
      { label: 'הנחות כלליות' },
      { label: 'דירה ריקה' },
    ];
    const out = pickAppealBlobExamplesForGemini(sources, ctx);
    expect(out[0]!.displayName).toContain('נכס ריק');
  });

  it('falls back to first sorted path when no rule matches', () => {
    const sources = [src('zzz.pdf'), src('אאא.pdf')];
    const out = pickAppealBlobExamplesForGemini(sources, baseCtx());
    expect(out).toHaveLength(1);
    expect(out[0]!.displayName).toContain('אאא');
  });
});
