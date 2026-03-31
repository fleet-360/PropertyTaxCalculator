import { describe, expect, it } from 'vitest';
import { parseJsonFromModelText } from '@/lib/appeal/geminiAppealLetterJson';
import { appealLetterGeminiPayloadSchema } from '@/lib/appeal/appealLetterPayload';

describe('parseJsonFromModelText', () => {
  it('parses strict JSON', () => {
    const raw = parseJsonFromModelText(
      '{"schemaVersion":1,"variant":"fallback","clauses":[{"id":"1","body":"ok"}]}',
    );
    expect(appealLetterGeminiPayloadSchema.parse(raw).clauses[0]?.body).toBe('ok');
  });

  it('repairs JSON with unescaped newlines inside a string (common LLM mistake)', () => {
    const broken = `{
  "schemaVersion": 1,
  "variant": "fallback",
  "clauses": [
    { "id": "1", "body": "שורה ראשונה
שורה שנייה" }
  ]
}`;
    const raw = parseJsonFromModelText(broken);
    const data = appealLetterGeminiPayloadSchema.parse(raw);
    expect(data.clauses[0]?.body).toContain('שורה ראשונה');
    expect(data.clauses[0]?.body).toContain('שורה שנייה');
  });

  it('strips markdown fence and leading prose', () => {
    const wrapped = `הנה JSON:
\`\`\`json
{"schemaVersion":1,"variant":"fallback","clauses":[]}
\`\`\`
`;
    const raw = parseJsonFromModelText(wrapped);
    expect(appealLetterGeminiPayloadSchema.parse(raw).clauses).toEqual([]);
  });
});
