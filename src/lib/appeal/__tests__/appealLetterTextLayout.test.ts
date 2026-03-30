import { describe, expect, it } from 'vitest';
import {
  peelLeadingWhitespaceIndent,
  reorderAppealDateAfterAnnex,
} from '@/lib/appeal/appealLetterTextLayout';

describe('reorderAppealDateAfterAnnex', () => {
  it('moves תאריך line after first כנספח line when it was too early', () => {
    const input = [
      'לכבוד',
      'תאריך: 1.1.2026',
      'פסקה',
      'מצורף דו"ח חיוב כנספח',
      'סיום',
    ].join('\n');

    const out = reorderAppealDateAfterAnnex(input);
    expect(out.split('\n')).toEqual([
      'לכבוד',
      'פסקה',
      'מצורף דו"ח חיוב כנספח',
      'תאריך: 1.1.2026',
      'סיום',
    ]);
  });

  it('leaves order unchanged when תאריך is already after כנספח', () => {
    const input = ['א', 'ב כנספח', 'תאריך: 2.2.2026'].join('\n');
    expect(reorderAppealDateAfterAnnex(input)).toBe(input);
  });

  it('no-ops when there is no כנספח line', () => {
    const input = ['תאריך: 1.1.2026', 'אחר'].join('\n');
    expect(reorderAppealDateAfterAnnex(input)).toBe(input);
  });
});

describe('peelLeadingWhitespaceIndent', () => {
  it('maps leading tabs to indent pt and strips them from rest', () => {
    const { indentPt, rest } = peelLeadingWhitespaceIndent('\t\t4. פסקה');
    expect(indentPt).toBe(56);
    expect(rest).toBe('4. פסקה');
  });

  it('combines tabs and spaces', () => {
    const { indentPt, rest } = peelLeadingWhitespaceIndent(' \t שלום');
    expect(rest).toBe('שלום');
    expect(indentPt).toBeGreaterThan(0);
  });
});
