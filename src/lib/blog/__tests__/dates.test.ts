import { describe, it, expect } from 'vitest';
import { formatPostDateHe, formatPostDateISO } from '@/lib/blog/dates';

describe('formatPostDateHe', () => {
  it('returns empty string for missing date', () => {
    expect(formatPostDateHe(undefined)).toBe('');
  });

  it('formats ISO string in Hebrew locale', () => {
    const s = formatPostDateHe('2020-06-15T12:00:00.000Z');
    expect(s.length).toBeGreaterThan(0);
    expect(s).toMatch(/2020/);
  });

  it('accepts Date instances', () => {
    const s = formatPostDateHe(new Date(Date.UTC(2020, 5, 15)));
    expect(s).toMatch(/2020/);
  });
});

describe('formatPostDateISO', () => {
  it('returns empty string for missing date', () => {
    expect(formatPostDateISO(undefined)).toBe('');
  });

  it('returns ISO string for Date', () => {
    const d = new Date(Date.UTC(2020, 5, 15, 12, 0, 0));
    expect(formatPostDateISO(d)).toBe('2020-06-15T12:00:00.000Z');
  });
});
