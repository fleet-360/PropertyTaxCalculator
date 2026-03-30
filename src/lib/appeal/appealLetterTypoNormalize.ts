/**
 * Deterministic fixes for recurring Gemini/OCR garbling in formal Hebrew appeal letters.
 */

export function normalizeAppealLetterTypos(t: string): string {
  let s = t;

  s = s.replace(/עפייי/g, 'עפ"י');
  s = s.replace(/עייפ\s+סעיף/g, 'עפ"י סעיף');
  s = s.replace(/דוייח/g, 'דו"ח');
  s = s.replace(/מייר/g, 'מ"ר');
  s = s.replace(/סהייכ/g, 'סה"כ');
  s = s.replace(/רצייב/g, 'רצ"ב');

  s = s.replace(/''הנכס''/g, '"הנכס"');
  s = s.replace(/'\s*הנכס\s*'/g, '"הנכס"');

  s = s.replace(/\s*:Date\s*$/gim, '');
  s = s
    .split('\n')
    .filter((line) => !/^\s*:Date\s*$/i.test(line) && !/^\s*Date:\s*$/i.test(line))
    .join('\n');

  return s;
}
