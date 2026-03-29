import { describe, expect, it } from 'vitest';
import {
  appealApplySignatureRequestSchema,
  appealGenerateRequestSchema,
  stripDataUrlBase64,
} from '@/lib/appeal/schemas';

describe('appealGenerateRequestSchema', () => {
  const minimal = {
    fullName: 'ישראל ישראלי',
    cityName: 'תל אביב',
    bimonthlyPayment: 1200,
    calculationResult: { outcome: 'overpaying' },
  };

  it('accepts minimal valid payload', () => {
    const r = appealGenerateRequestSchema.safeParse(minimal);
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.fullName).toBe('ישראל ישראלי');
      expect(r.data.calculationResult).toEqual({ outcome: 'overpaying' });
    }
  });

  it('rejects empty fullName', () => {
    const r = appealGenerateRequestSchema.safeParse({ ...minimal, fullName: '   ' });
    expect(r.success).toBe(false);
  });

  it('defaults calculationResult', () => {
    const { calculationResult: _c, ...rest } = minimal;
    const r = appealGenerateRequestSchema.safeParse(rest);
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.calculationResult).toEqual({});
    }
  });
});

describe('appealApplySignatureRequestSchema', () => {
  it('accepts stripped base64 placeholders', () => {
    const pdf = 'a'.repeat(150);
    const png =
      Buffer.from([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
      ]).toString('base64') + 'x'.repeat(80);

    const r = appealApplySignatureRequestSchema.safeParse({
      draftPdfBase64: pdf,
      signaturePngBase64: png,
    });
    expect(r.success).toBe(true);
  });

  it('rejects short pdf', () => {
    const r = appealApplySignatureRequestSchema.safeParse({
      draftPdfBase64: 'short',
      signaturePngBase64: 'b'.repeat(100),
    });
    expect(r.success).toBe(false);
  });
});

describe('stripDataUrlBase64', () => {
  it('strips data URL prefix', () => {
    expect(stripDataUrlBase64('data:image/png;base64,QUJD')).toBe('QUJD');
  });
});
