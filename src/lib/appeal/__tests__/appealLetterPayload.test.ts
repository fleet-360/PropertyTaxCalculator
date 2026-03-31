import { describe, expect, it } from 'vitest';
import {
  appealLetterGeminiPayloadSchema,
  assertVariantMatch,
} from '@/lib/appeal/appealLetterPayload';

describe('appealLetterGeminiPayloadSchema', () => {
  it('defaults clauses to empty array when omitted', () => {
    const data = appealLetterGeminiPayloadSchema.parse({
      schemaVersion: 1,
      variant: 'area_correction',
    });
    expect(data.clauses).toEqual([]);
  });

  it('parses clause entries', () => {
    const data = appealLetterGeminiPayloadSchema.parse({
      schemaVersion: 1,
      variant: 'area_correction',
      clauses: [{ id: '1', body: 'שלום' }],
    });
    expect(data.clauses).toHaveLength(1);
  });

  it('parses optional role, headingLevel, emphasis, and items', () => {
    const data = appealLetterGeminiPayloadSchema.parse({
      schemaVersion: 1,
      variant: 'area_correction',
      clauses: [
        {
          id: 'h1',
          body: 'כותרת ראשית',
          role: 'heading',
          headingLevel: 1,
        },
        {
          id: '8b',
          body: '',
          items: ['קריטריון א', 'קריטריון ב'],
        },
        { id: '2', body: 'מודגש', emphasis: true },
      ],
    });
    expect(data.clauses[0]?.role).toBe('heading');
    expect(data.clauses[0]?.headingLevel).toBe(1);
    expect(data.clauses[1]?.items).toHaveLength(2);
    expect(data.clauses[2]?.emphasis).toBe(true);
  });
});

describe('assertVariantMatch', () => {
  it('throws when variant differs', () => {
    expect(() =>
      assertVariantMatch(
        { schemaVersion: 1, variant: 'fallback', clauses: [] },
        'area_correction',
      ),
    ).toThrow(/mismatch/);
  });
});
