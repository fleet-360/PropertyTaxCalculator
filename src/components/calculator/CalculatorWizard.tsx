'use client';

import { useReducer, Dispatch } from 'react';
import Container from '@mui/material/Container';
import InitialInfoStep from './steps/InitialInfoStep';
import InitialWaiverStep from './steps/InitialWaiverStep';
import DataEntryStep from './steps/DataEntryStep';
import ExemptionsStep from './steps/ExemptionsStep';
import DisclaimerStep from './steps/DisclaimerStep';
import ResultsGateStep from './steps/ResultsGateStep';
import ResultsDisplayStep from './steps/ResultsDisplayStep';
import AppealStep from './steps/AppealStep';
import ContactRedirectStep from './steps/ContactRedirectStep';

// ── State ──

export interface Designation {
  type: string;
  subtype: string;
  zone: string;
  area: number;
}

export interface SelectedExemption {
  sectionCode: string;
  subSectionCode: string;
}

export interface WizardState {
  currentStep: number;
  propertyType: 'private' | 'business' | null;
  citySlug: string;
  cityData: any | null;
  // Form data
  fullName: string;
  idNumber: string;
  email: string;
  phone: string;
  propertyPurpose: string;
  propertyNumber: string;
  propertyId: string;
  propertyArea: number;
  coveredBalconyArea: number;
  storageArea: number;
  parkingArea: number;
  address: string;
  block: string;
  parcel: string;
  classificationCode: string;
  zone: string;
  subType: string;
  bimonthlyPayment: number;
  reportedPayment: number;
  paymentPeriod: string;
  // Business
  designations: Designation[];
  // Errors
  measurementError: { claimed: number; attachment: string } | null;
  classificationError: { suggested: string } | null;
  // Exemptions
  selectedExemptions: SelectedExemption[];
  householdSize: number;
  childrenCount: number;
  // Consent
  consentGiven: boolean;
  // Results
  calculationResult: any | null;
  // Loading
  isLoading: boolean;
  // Contact redirect reason (when calculation can't proceed)
  contactRedirectReason: 'area' | 'designations' | 'city' | 'other_city' | 'error' | null;
}

const initialState: WizardState = {
  currentStep: 0,
  propertyType: null,
  citySlug: '',
  cityData: null,
  fullName: '',
  idNumber: '',
  email: '',
  phone: '',
  propertyPurpose: '',
  propertyNumber: '',
  propertyId: '',
  propertyArea: 0,
  coveredBalconyArea: 0,
  storageArea: 0,
  parkingArea: 0,
  address: '',
  block: '',
  parcel: '',
  classificationCode: '',
  zone: '',
  subType: '',
  bimonthlyPayment: 0,
  reportedPayment: 0,
  paymentPeriod: 'bimonthly',
  designations: [{ type: '', subtype: '', zone: '', area: 0 }],
  measurementError: null,
  classificationError: null,
  selectedExemptions: [],
  householdSize: 1,
  childrenCount: 0,
  consentGiven: false,
  calculationResult: null,
  isLoading: false,
  contactRedirectReason: null,
};

// ── Step definitions ──
// Logical steps in the wizard flow:
// 0: InitialInfoStep      — property type + city + document upload
// 1: InitialWaiverStep    — initial waiver / consent
// 2: DataEntryStep        — property details + error report (merged)
// 3: ExemptionsStep       — discounts (SKIPPED for business)
// 4: DisclaimerStep       — consent + triggers calculation
// 5: ResultsGateStep      — shows outcome
// 6: ResultsDisplayStep   — detailed results
// 7: AppealStep           — appeal + waiver

const EXEMPTIONS_STEP = 3;

// ── Actions ──

export type WizardAction =
  | { type: 'SET_STEP'; step: number }
  | { type: 'NEXT_STEP' }
  | { type: 'PREV_STEP' }
  | { type: 'RESET_CALCULATOR' }
  | { type: 'SET_PROPERTY_TYPE'; payload: 'private' | 'business' }
  | { type: 'SET_CITY'; payload: { slug: string; data?: any } }
  | { type: 'SET_CITY_DATA'; payload: any }
  | { type: 'UPDATE_FIELD'; field: keyof WizardState; value: any }
  | { type: 'UPDATE_FIELDS_BULK'; payload: Partial<WizardState> }
  | { type: 'SET_DESIGNATIONS'; payload: Designation[] }
  | { type: 'SET_SELECTED_EXEMPTIONS'; payload: SelectedExemption[] }
  | { type: 'SET_MEASUREMENT_ERROR'; payload: WizardState['measurementError'] }
  | { type: 'SET_CLASSIFICATION_ERROR'; payload: WizardState['classificationError'] }
  | { type: 'SET_CALCULATION_RESULT'; payload: any }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_CONTACT_REDIRECT'; payload: WizardState['contactRedirectReason'] };

function shouldSkipExemptions(state: WizardState): boolean {
  return state.propertyType === 'business';
}

function wizardReducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case 'SET_STEP':
      return { ...state, currentStep: action.step };
    case 'NEXT_STEP': {
      let nextStep = state.currentStep + 1;
      // Skip ExemptionsStep for business properties
      if (nextStep === EXEMPTIONS_STEP && shouldSkipExemptions(state)) {
        nextStep = EXEMPTIONS_STEP + 1;
      }
      return { ...state, currentStep: nextStep };
    }
    case 'PREV_STEP': {
      let prevStep = Math.max(0, state.currentStep - 1);
      // Skip ExemptionsStep backwards for business
      if (prevStep === EXEMPTIONS_STEP && shouldSkipExemptions(state)) {
        prevStep = EXEMPTIONS_STEP - 1;
      }
      return { ...state, currentStep: prevStep };
    }
    case 'SET_PROPERTY_TYPE':
      return { ...state, propertyType: action.payload };
    case 'SET_CITY':
      return { ...state, citySlug: action.payload.slug, cityData: action.payload.data ?? state.cityData };
    case 'SET_CITY_DATA':
      return { ...state, cityData: action.payload };
    case 'UPDATE_FIELD':
      return { ...state, [action.field]: action.value };
    case 'UPDATE_FIELDS_BULK':
      return { ...state, ...action.payload };
    case 'SET_DESIGNATIONS':
      return { ...state, designations: action.payload };
    case 'SET_SELECTED_EXEMPTIONS':
      return { ...state, selectedExemptions: action.payload };
    case 'SET_MEASUREMENT_ERROR':
      return { ...state, measurementError: action.payload };
    case 'SET_CLASSIFICATION_ERROR':
      return { ...state, classificationError: action.payload };
    case 'SET_CALCULATION_RESULT':
      return { ...state, calculationResult: action.payload };
    case 'RESET_CALCULATOR':
      return { ...initialState };
    case 'SET_CONTACT_REDIRECT':
      return { ...state, contactRedirectReason: action.payload };
    default:
      return state;
  }
}

// ── Props type for steps ──

export interface StepProps {
  state: WizardState;
  dispatch: Dispatch<WizardAction>;
}

// ── Validation checks ──

function getContactRedirectReason(state: WizardState): WizardState['contactRedirectReason'] {
  // Check "עיר אחרת" (other city — not in database)
  if (state.citySlug === 'other') return 'other_city';

  // Check total area > 1000
  const totalArea =
    (state.propertyArea || 0) +
    (state.coveredBalconyArea || 0) +
    (state.storageArea || 0) +
    (state.parkingArea || 0);
  if (totalArea > 1000) return 'area';

  // Check business with multiple designations
  if (state.propertyType === 'business' && state.designations.length > 1) {
    return 'designations';
  }

  // Check city data availability
  if (!state.cityData || !state.cityData.types || state.cityData.types.length === 0) {
    return 'city';
  }

  return null;
}

// ── Component ──

const STEP_COMPONENTS = [
  InitialInfoStep,     // 0 — property type + city + document upload
  InitialWaiverStep,   // 1 — initial waiver
  DataEntryStep,       // 2 — property details + error report (merged)
  ExemptionsStep,      // 3 — exemptions (skipped for business)
  DisclaimerStep,      // 4 — consent + calculation
  ResultsGateStep,     // 5 — results gate
  ResultsDisplayStep,  // 6 — detailed results
  AppealStep,          // 7 — appeal + waiver
];

export default function CalculatorWizard() {
  const [state, dispatch] = useReducer(wizardReducer, initialState);

  // Check for contact redirect conditions after data entry (step 1 → step 2/3)
  // This runs when entering the exemptions or disclaimer step
  const redirectReason = (state.currentStep >= EXEMPTIONS_STEP && state.currentStep <= 4)
    ? getContactRedirectReason(state)
    : null;

  // Show ContactRedirectStep if redirect needed
  if (redirectReason || state.contactRedirectReason) {
    return (
      <Container maxWidth="md">
        <ContactRedirectStep reason={redirectReason ?? state.contactRedirectReason!} />
      </Container>
    );
  }

  const StepComponent = STEP_COMPONENTS[state.currentStep];

  return (
    <Container maxWidth="md">
      {StepComponent && <StepComponent key={state.currentStep} state={state} dispatch={dispatch} />}
    </Container>
  );
}
