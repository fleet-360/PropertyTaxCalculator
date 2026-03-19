'use client';

import { useReducer, Dispatch } from 'react';
import Container from '@mui/material/Container';
import WizardStepper from './WizardStepper';
import PropertyTypeStep from './steps/PropertyTypeStep';
import CitySelectStep from './steps/CitySelectStep';
import DataEntryStep from './steps/DataEntryStep';
import RateInfoStep from './steps/RateInfoStep';
import ErrorReportStep from './steps/ErrorReportStep';
import ExemptionsStep from './steps/ExemptionsStep';
import DisclaimerStep from './steps/DisclaimerStep';
import ResultsGateStep from './steps/ResultsGateStep';
import ResultsDisplayStep from './steps/ResultsDisplayStep';
import AppealStep from './steps/AppealStep';

// ── State ──

export interface Designation {
  type: string;
  subtype: string;
  zone: string;
  area: number;
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
  // Business
  designations: Designation[];
  // Errors
  measurementError: { claimed: number; attachment: string } | null;
  classificationError: { suggested: string } | null;
  // Exemptions
  selectedExemption: string;
  householdSize: number;
  childrenCount: number;
  // Consent
  consentGiven: boolean;
  // Results
  calculationResult: any | null;
  // Loading
  isLoading: boolean;
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
  designations: [{ type: '', subtype: '', zone: '', area: 0 }],
  measurementError: null,
  classificationError: null,
  selectedExemption: '',
  householdSize: 1,
  childrenCount: 0,
  consentGiven: false,
  calculationResult: null,
  isLoading: false,
};

// ── Actions ──

export type WizardAction =
  | { type: 'SET_STEP'; step: number }
  | { type: 'NEXT_STEP' }
  | { type: 'PREV_STEP' }
  | { type: 'SET_PROPERTY_TYPE'; payload: 'private' | 'business' }
  | { type: 'SET_CITY'; payload: { slug: string; data?: any } }
  | { type: 'SET_CITY_DATA'; payload: any }
  | { type: 'UPDATE_FIELD'; field: keyof WizardState; value: any }
  | { type: 'UPDATE_FIELDS_BULK'; payload: Partial<WizardState> }
  | { type: 'SET_DESIGNATIONS'; payload: Designation[] }
  | { type: 'SET_MEASUREMENT_ERROR'; payload: WizardState['measurementError'] }
  | { type: 'SET_CLASSIFICATION_ERROR'; payload: WizardState['classificationError'] }
  | { type: 'SET_CALCULATION_RESULT'; payload: any }
  | { type: 'SET_LOADING'; payload: boolean };

function wizardReducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case 'SET_STEP':
      return { ...state, currentStep: action.step };
    case 'NEXT_STEP':
      return { ...state, currentStep: state.currentStep + 1 };
    case 'PREV_STEP':
      return { ...state, currentStep: Math.max(0, state.currentStep - 1) };
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
    case 'SET_MEASUREMENT_ERROR':
      return { ...state, measurementError: action.payload };
    case 'SET_CLASSIFICATION_ERROR':
      return { ...state, classificationError: action.payload };
    case 'SET_CALCULATION_RESULT':
      return { ...state, calculationResult: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    default:
      return state;
  }
}

// ── Props type for steps ──

export interface StepProps {
  state: WizardState;
  dispatch: Dispatch<WizardAction>;
}

// ── Component ──

const STEP_COMPONENTS = [
  PropertyTypeStep,    // 0
  CitySelectStep,      // 1
  DataEntryStep,       // 2
  RateInfoStep,        // 3
  ErrorReportStep,     // 4
  ExemptionsStep,      // 5
  DisclaimerStep,      // 6
  ResultsGateStep,     // 7
  ResultsDisplayStep,  // 8
  AppealStep,          // 9
];

export default function CalculatorWizard() {
  const [state, dispatch] = useReducer(wizardReducer, initialState);

  const StepComponent = STEP_COMPONENTS[state.currentStep];

  return (
    <Container maxWidth="md">
      <WizardStepper currentStep={state.currentStep} />
      {StepComponent && <StepComponent state={state} dispatch={dispatch} />}
    </Container>
  );
}
