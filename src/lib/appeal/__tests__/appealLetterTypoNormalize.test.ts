import { describe, expect, it } from 'vitest';
import { normalizeAppealLetterTypos } from '@/lib/appeal/appealLetterTypoNormalize';

describe('normalizeAppealLetterTypos', () => {
  it('fixes common garbling', () => {
    const s = 'עפייי דוייח בשטח 100 מייר סהייכ רצייב';
    expect(normalizeAppealLetterTypos(s)).toBe('עפ"י דו"ח בשטח 100 מ"ר סה"כ רצ"ב');
  });

  it('fixes עייפ סעיף', () => {
    expect(normalizeAppealLetterTypos('עייפ סעיף 7')).toBe('עפ"י סעיף 7');
  });

  it('removes :Date line and trailing :Date', () => {
    expect(normalizeAppealLetterTypos('עיר\n:Date\nא')).toBe('עיר\nא');
    expect(normalizeAppealLetterTypos('שורה :Date')).toBe('שורה');
  });

  it('removes standalone Date: line', () => {
    expect(normalizeAppealLetterTypos('א\nDate:\nב')).toBe('א\nב');
  });
});
