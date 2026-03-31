import { describe, expect, it } from 'vitest';
import { initialState } from '@/components/calculator/CalculatorWizard';
import { getAppealDocumentMissingItems, validateAppealMissingFieldValue } from '@/components/calculator/appealDocumentCompleteness';

function basePrivateState() {
  return {
    ...initialState,
    propertyType: 'private' as const,
    citySlug: 'mock-city',
    fullName: 'Test User',
    email: 'a@b.co',
    idNumber: '123456789',
    phone: '050',
    address: 'Addr',
    propertyNumber: '1',
    propertyId: '2',
    block: '3',
    parcel: '4',
    classificationCode: '5',
    propertyPurpose: 'מגורים',
    zone: 'א',
    subType: 'standard',
    propertyArea: 80,
    bimonthlyPayment: 100,
    calculationResult: { x: 1 },
  };
}

describe('getAppealDocumentMissingItems', () => {
  it('returns empty when all appeal-facing fields are filled (private)', () => {
    expect(getAppealDocumentMissingItems(basePrivateState())).toEqual([]);
  });

  it('lists missing scalar fields', () => {
    const s = { ...basePrivateState(), idNumber: '', block: '', email: 'bad' };
    const m = getAppealDocumentMissingItems(s);
    expect(m.some((x) => x.kind === 'field' && x.key === 'idNumber')).toBe(true);
    expect(m.some((x) => x.kind === 'field' && x.key === 'block')).toBe(true);
    expect(m.some((x) => x.kind === 'field' && x.key === 'email')).toBe(true);
  });

  it('returns only businessDesignations when business row invalid', () => {
    const s = {
      ...basePrivateState(),
      propertyType: 'business' as const,
      designations: [{ type: '', subtype: '', zone: '', area: 0 }],
    };
    expect(getAppealDocumentMissingItems(s)).toEqual([
      expect.objectContaining({ kind: 'businessDesignations' }),
    ]);
  });

  it('allows business when at least one designation row is complete', () => {
    const s = {
      ...basePrivateState(),
      propertyType: 'business' as const,
      designations: [
        { type: 'x', subtype: 'y', zone: 'z', area: 10 },
        { type: '', subtype: '', zone: '', area: 0 },
      ],
    };
    const m = getAppealDocumentMissingItems(s);
    expect(m.every((x) => x.kind !== 'businessDesignations')).toBe(true);
  });
});

describe('validateAppealMissingFieldValue', () => {
  it('validates email', () => {
    expect(validateAppealMissingFieldValue('email', '')).not.toBeNull();
    expect(validateAppealMissingFieldValue('email', 'x')).not.toBeNull();
    expect(validateAppealMissingFieldValue('email', 'x@y.co')).toBeNull();
  });

  it('validates propertyArea', () => {
    expect(validateAppealMissingFieldValue('propertyArea', '0')).not.toBeNull();
    expect(validateAppealMissingFieldValue('propertyArea', '12.5')).toBeNull();
  });
});
