import { describe, it, expect } from 'vitest';
import { headingPlainTextToAnchorId } from '@/lib/headingAnchorId';

describe('headingPlainTextToAnchorId', () => {
  it('keeps Latin words with hyphen separators', () => {
    expect(headingPlainTextToAnchorId('Hello World')).toBe('hello-world');
  });

  it('collapses whitespace and punctuation to single hyphens', () => {
    expect(headingPlainTextToAnchorId('a   b---c')).toBe('a-b-c');
  });

  it('preserves Hebrew letters and separates words', () => {
    expect(headingPlainTextToAnchorId('הנחות ארנונה')).toBe('הנחות-ארנונה');
  });

  it('keeps digits mixed with letters', () => {
    expect(headingPlainTextToAnchorId('שלב 2 — פרטים')).toBe('שלב-2-פרטים');
  });

  it('trims leading and trailing separators', () => {
    expect(headingPlainTextToAnchorId('  ---x---  ')).toBe('x');
  });
});
