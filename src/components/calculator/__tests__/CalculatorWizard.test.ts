/**
 * CalculatorWizard unit tests — reducer + redirect logic
 * Pure unit tests, no DOM rendering needed.
 */

import { describe, it, expect } from 'vitest';
import {
  wizardReducer,
  getContactRedirectReason,
  initialState,
  type WizardState,
  type WizardAction,
} from '@/components/calculator/CalculatorWizard';

// Helper: create state with overrides
function makeState(overrides: Partial<WizardState> = {}): WizardState {
  return { ...initialState, ...overrides };
}

// ═══════════════════════════════════════════════════════════════════════
// wizardReducer
// ═══════════════════════════════════════════════════════════════════════

describe('wizardReducer', () => {
  it('NEXT_STEP: 0 → 1', () => {
    const state = makeState({ currentStep: 0 });
    const result = wizardReducer(state, { type: 'NEXT_STEP' });
    expect(result.currentStep).toBe(1);
  });

  it('PREV_STEP: 2 → 1', () => {
    const state = makeState({ currentStep: 2 });
    const result = wizardReducer(state, { type: 'PREV_STEP' });
    expect(result.currentStep).toBe(1);
  });

  it('PREV_STEP from 0 stays at 0', () => {
    const state = makeState({ currentStep: 0 });
    const result = wizardReducer(state, { type: 'PREV_STEP' });
    expect(result.currentStep).toBe(0);
  });

  it('NEXT_STEP skips exemptions (step 3) for business', () => {
    const state = makeState({ currentStep: 2, propertyType: 'business' });
    const result = wizardReducer(state, { type: 'NEXT_STEP' });
    expect(result.currentStep).toBe(4); // skips 3
  });

  it('PREV_STEP skips exemptions (step 3) backward for business', () => {
    const state = makeState({ currentStep: 4, propertyType: 'business' });
    const result = wizardReducer(state, { type: 'PREV_STEP' });
    expect(result.currentStep).toBe(2); // skips 3
  });

  it('NEXT_STEP does NOT skip exemptions for private', () => {
    const state = makeState({ currentStep: 2, propertyType: 'private' });
    const result = wizardReducer(state, { type: 'NEXT_STEP' });
    expect(result.currentStep).toBe(3);
  });

  it('SET_PROPERTY_TYPE updates propertyType', () => {
    const state = makeState();
    const result = wizardReducer(state, { type: 'SET_PROPERTY_TYPE', payload: 'business' });
    expect(result.propertyType).toBe('business');
  });

  it('SET_CITY updates citySlug and cityData', () => {
    const state = makeState();
    const cityData = { cityName: 'תל אביב', types: [] };
    const result = wizardReducer(state, { type: 'SET_CITY', payload: { slug: 'tel-aviv', data: cityData } });
    expect(result.citySlug).toBe('tel-aviv');
    expect(result.cityData).toBe(cityData);
  });

  it('UPDATE_FIELD updates a single field', () => {
    const state = makeState();
    const result = wizardReducer(state, { type: 'UPDATE_FIELD', field: 'fullName', value: 'ישראל ישראלי' });
    expect(result.fullName).toBe('ישראל ישראלי');
  });

  it('UPDATE_FIELDS_BULK updates multiple fields', () => {
    const state = makeState();
    const result = wizardReducer(state, {
      type: 'UPDATE_FIELDS_BULK',
      payload: { fullName: 'ישראל', email: 'test@test.com', propertyArea: 80 },
    });
    expect(result.fullName).toBe('ישראל');
    expect(result.email).toBe('test@test.com');
    expect(result.propertyArea).toBe(80);
  });

  it('SET_CALCULATION_RESULT stores result', () => {
    const state = makeState();
    const calcResult = { outcome: 'overpaying', savingsBimonthly: 100 };
    const result = wizardReducer(state, { type: 'SET_CALCULATION_RESULT', payload: calcResult });
    expect(result.calculationResult).toBe(calcResult);
  });

  it('RESET_CALCULATOR returns to initial state', () => {
    const state = makeState({
      currentStep: 5,
      propertyType: 'business',
      fullName: 'test',
      propertyArea: 200,
      calculationResult: { outcome: 'match' },
    });
    const result = wizardReducer(state, { type: 'RESET_CALCULATOR' });
    expect(result).toEqual(initialState);
  });

  it('SET_STEP sets exact step number', () => {
    const state = makeState();
    const result = wizardReducer(state, { type: 'SET_STEP', step: 5 });
    expect(result.currentStep).toBe(5);
  });

  it('SET_DESIGNATIONS updates designations array', () => {
    const state = makeState();
    const newDesignations = [{ type: 'business', subtype: 'retail', zone: 'א', area: 50 }];
    const result = wizardReducer(state, { type: 'SET_DESIGNATIONS', payload: newDesignations });
    expect(result.designations).toEqual(newDesignations);
  });

  it('SET_CONTACT_REDIRECT sets redirect reason', () => {
    const state = makeState();
    const result = wizardReducer(state, { type: 'SET_CONTACT_REDIRECT', payload: 'area' });
    expect(result.contactRedirectReason).toBe('area');
  });

  it('SET_LOADING updates loading state', () => {
    const state = makeState();
    const result = wizardReducer(state, { type: 'SET_LOADING', payload: true });
    expect(result.isLoading).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// getContactRedirectReason
// ═══════════════════════════════════════════════════════════════════════

describe('getContactRedirectReason', () => {
  it('citySlug "other" → "other_city"', () => {
    const state = makeState({ citySlug: 'other', cityData: { types: [{}] } });
    expect(getContactRedirectReason(state)).toBe('other_city');
  });

  it('totalArea > 1000 → "area"', () => {
    const state = makeState({
      citySlug: 'mock-city',
      cityData: { types: [{}] },
      propertyArea: 800,
      coveredBalconyArea: 150,
      storageArea: 100,
    });
    expect(getContactRedirectReason(state)).toBe('area');
  });

  it('business + 2 designations → "designations"', () => {
    const state = makeState({
      citySlug: 'mock-city',
      cityData: { types: [{}] },
      propertyType: 'business',
      designations: [
        { type: 'a', subtype: 'b', zone: 'c', area: 100 },
        { type: 'd', subtype: 'e', zone: 'f', area: 200 },
      ],
    });
    expect(getContactRedirectReason(state)).toBe('designations');
  });

  it('no cityData → "city"', () => {
    const state = makeState({ citySlug: 'mock-city', cityData: null });
    expect(getContactRedirectReason(state)).toBe('city');
  });

  it('cityData with empty types → "city"', () => {
    const state = makeState({ citySlug: 'mock-city', cityData: { types: [] } });
    expect(getContactRedirectReason(state)).toBe('city');
  });

  it('valid state → null', () => {
    const state = makeState({
      citySlug: 'mock-city',
      cityData: { types: [{ code: 'residential' }] },
      propertyType: 'private',
      propertyArea: 80,
    });
    expect(getContactRedirectReason(state)).toBeNull();
  });

  it('business with single designation → null (no redirect)', () => {
    const state = makeState({
      citySlug: 'mock-city',
      cityData: { types: [{ code: 'business' }] },
      propertyType: 'business',
      designations: [{ type: 'a', subtype: 'b', zone: 'c', area: 100 }],
    });
    expect(getContactRedirectReason(state)).toBeNull();
  });
});
