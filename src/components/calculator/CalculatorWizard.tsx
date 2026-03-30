'use client';

import { useEffect, useMemo, useReducer, Dispatch } from 'react';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import DocumentPreviewPopover from '@/components/common/DocumentPreviewPopover';
import InitialInfoStep from './steps/InitialInfoStep';
import InitialWaiverStep from './steps/InitialWaiverStep';
import DataEntryStep from './steps/DataEntryStep';
import ExemptionsStep from './steps/ExemptionsStep';
import DisclaimerStep from './steps/DisclaimerStep';
import ResultsGateStep from './steps/ResultsGateStep';
import ResultsDisplayStep from './steps/ResultsDisplayStep';
import AppealStep from './steps/AppealStep';
import ContactRedirectStep from './steps/ContactRedirectStep';
import { CalculatorFeaturesContext } from './CalculatorFeaturesContext';

import type { ISelectedExemption } from '@/lib/types/lead';
import {
  DEFAULT_CALCULATOR_FEATURE_CONFIG,
  type CalculatorFeatureConfig,
} from '@/lib/types/system-config';
import { priceAfterCoupon } from '@/lib/priceAfterCoupon';
import { isVercelBlobPublicUrl } from '@/lib/ordinancePdf';
import type { AppliedWizardCoupon } from './wizardTypes';

export type { CalculatorFeaturesContextValue } from './CalculatorFeaturesContext';
export { CalculatorFeaturesContext, useCalculatorFeatures } from './CalculatorFeaturesContext';
export type { AppliedWizardCoupon } from './wizardTypes';

// ── State ──

export interface Designation {
  type: string;
  subtype: string;
  zone: string;
  area: number;
}

export type SelectedExemption = ISelectedExemption;

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
  /** Draft input for coupon (shown alongside payment on results gate / appeal) */
  couponCodeDraft: string;
  /** Applied coupon — reused for calculator payment and appeal payment */
  appliedCoupon: AppliedWizardCoupon | null;
  // Dynamic area types (when city defines areaTypeDiscounts)
  additionalAreas: { areaType: string; areaSqm: number }[];
  // Fee opt-in (names of optional fees the user opted into)
  selectedFees: string[];
  // Lead tracking
  leadId: string | null;
  calculationIndex: number;
  // Mia speech bubble
  miaMessageId: string;
}

export const initialState: WizardState = {
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
  couponCodeDraft: '',
  appliedCoupon: null,
  additionalAreas: [],
  selectedFees: [],
  leadId: null,
  calculationIndex: 0,
  miaMessageId: 'step-0-default',
};

// ── Step definitions ──
// 0: InitialInfoStep
// 1: InitialWaiverStep
// 2: DataEntryStep
// 3: ExemptionsStep (skipped for business)
// 4: DisclaimerStep
// 5: ResultsGateStep (coupon UI inline when payment + under/overpay)
// 6: ResultsDisplayStep
// 7: AppealStep

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
  | { type: 'SET_CONTACT_REDIRECT'; payload: WizardState['contactRedirectReason'] }
  | { type: 'SET_LEAD_ID'; payload: string }
  | { type: 'SET_CALCULATION_INDEX'; payload: number }
  | { type: 'SET_MIA_MESSAGE'; payload: string };

export function shouldSkipExemptions(state: WizardState): boolean {
  return state.propertyType === 'business';
}

export function wizardReducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case 'SET_STEP':
      return { ...state, currentStep: action.step };
    case 'NEXT_STEP': {
      let nextStep = state.currentStep + 1;
      if (nextStep === EXEMPTIONS_STEP && shouldSkipExemptions(state)) {
        nextStep = EXEMPTIONS_STEP + 1;
      }
      return { ...state, currentStep: nextStep };
    }
    case 'PREV_STEP': {
      let prevStep = Math.max(0, state.currentStep - 1);
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
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'RESET_CALCULATOR':
      return { ...initialState };
    case 'SET_CONTACT_REDIRECT':
      return { ...state, contactRedirectReason: action.payload };
    case 'SET_LEAD_ID':
      return { ...state, leadId: action.payload };
    case 'SET_CALCULATION_INDEX':
      return { ...state, calculationIndex: action.payload };
    case 'SET_MIA_MESSAGE':
      return { ...state, miaMessageId: action.payload };
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

export function getContactRedirectReason(state: WizardState): WizardState['contactRedirectReason'] {
  if (state.citySlug === 'other') return 'other_city';

  const totalArea =
    (state.propertyArea || 0) +
    (state.coveredBalconyArea || 0) +
    (state.storageArea || 0) +
    (state.parkingArea || 0);
  if (totalArea > 1000) return 'area';

  if (state.propertyType === 'business' && state.designations.length > 1) {
    return 'designations';
  }

  if (!state.cityData || !state.cityData.types || state.cityData.types.length === 0) {
    return 'city';
  }

  return null;
}

// ── Component ──

const STEP_COMPONENTS = [
  InitialInfoStep,
  InitialWaiverStep,
  DataEntryStep,
  ExemptionsStep,
  DisclaimerStep,
  ResultsGateStep,
  ResultsDisplayStep,
  AppealStep,
];

function mergeFeatures(partial?: Partial<CalculatorFeatureConfig>): CalculatorFeatureConfig {
  return { ...DEFAULT_CALCULATOR_FEATURE_CONFIG, ...partial };
}

export interface CalculatorWizardProps {
  features?: Partial<CalculatorFeatureConfig>;
  onMiaMessage?: (messageId: string) => void;
}

export default function CalculatorWizard(props: CalculatorWizardProps = {}) {
  const features = mergeFeatures(props.features);
  const { onMiaMessage } = props;
  const [state, dispatch] = useReducer(wizardReducer, initialState);

  // Notify parent whenever miaMessageId changes
  useEffect(() => {
    onMiaMessage?.(state.miaMessageId);
  }, [state.miaMessageId, onMiaMessage]);

  const applied = state.appliedCoupon;
  const featuresContextValue = useMemo(
    () => ({
      paymentEnabled: features.paymentEnabled,
      calculatorPrice: features.calculatorPrice,
      appealPrice: features.appealPrice,
      calculatorChargeAmount: priceAfterCoupon(features.calculatorPrice, applied),
      appealChargeAmount: priceAfterCoupon(features.appealPrice, applied),
    }),
    [features.paymentEnabled, features.calculatorPrice, features.appealPrice, applied]
  );

  const redirectReason =
    state.currentStep >= EXEMPTIONS_STEP && state.currentStep <= 4
      ? getContactRedirectReason(state)
      : null;

  if (redirectReason || state.contactRedirectReason) {
    return (
      <Container maxWidth="md">
        <ContactRedirectStep reason={redirectReason ?? state.contactRedirectReason!} dispatch={dispatch} state={state} />
      </Container>
    );
  }

  const StepComponent = STEP_COMPONENTS[state.currentStep];

  const ordinanceUrl = state.cityData?.ordinanceUrl as string | undefined;
  const showOrdinanceLink =
    Boolean(state.citySlug) && state.citySlug !== 'other' && Boolean(ordinanceUrl);
  const ordinanceTitle =
    state.cityData?.cityName != null && String(state.cityData.cityName).trim() !== ''
      ? `צו הארנונה — ${state.cityData.cityName}`
      : 'צו הארנונה';

  return (
    <CalculatorFeaturesContext.Provider value={featuresContextValue}>
      <Container maxWidth="md" sx={{ position: 'relative', flexDirection: 'column', alignItems: 'stretch' }}>
        {showOrdinanceLink && ordinanceUrl && (
          <Box sx={{ textAlign: 'center', mb: 2, position: 'absolute', top: 0, left: 0 }}>
            <DocumentPreviewPopover
              documentUrl={ordinanceUrl}
              previewSrc={
                isVercelBlobPublicUrl(ordinanceUrl)
                  ? `/api/view-pdf/${encodeURIComponent(state.citySlug!)}`
                  : undefined
              }
              title={ordinanceTitle}
              triggerLabel="צפייה בצו הארנונה"
              triggerAriaLabel="פתיחת תצוגה מקדימה של צו הארנונה"
              downloadLabel="הורדת צו הארנונה (PDF)"
            />
          </Box>
        )}
        {StepComponent && <StepComponent key={state.currentStep} state={state} dispatch={dispatch} />}
      </Container>
    </CalculatorFeaturesContext.Provider>
  );
}
