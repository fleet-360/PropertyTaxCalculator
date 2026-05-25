'use client';

import { useEffect, useMemo, useReducer, useImperativeHandle, forwardRef, Dispatch } from 'react';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import InitialInfoStep from './steps/InitialInfoStep';
import CityBillStep from './steps/CityBillStep';
import InitialWaiverStep from './steps/InitialWaiverStep';
import DataEntryStep from './steps/DataEntryStep';
import ExemptionsStep from './steps/ExemptionsStep';
import DisclaimerStep from './steps/DisclaimerStep';
import ResultsGateStep from './steps/ResultsGateStep';
import ResultsDisplayStep from './steps/ResultsDisplayStep';
import AppealStep from './steps/AppealStep';
import ContactRedirectStep from './steps/ContactRedirectStep';
import { CalculatorFeaturesContext } from './CalculatorFeaturesContext';
import WizardLayout from './WizardLayout';

import type { ISelectedExemption } from '@/lib/types/lead';
import {
  DEFAULT_CALCULATOR_FEATURE_CONFIG,
  type CalculatorFeatureConfig,
} from '@/lib/types/system-config';
import { priceAfterCoupon } from '@/lib/priceAfterCoupon';
import { isVercelBlobPublicUrl } from '@/lib/ordinancePdf';
import type { AppliedWizardCoupon } from './wizardTypes';
import { SxProps } from '@mui/material';
import { Theme } from '@emotion/react';

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
  //
  saveInfoPremission: boolean;
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
  /** Mia speech bubble — single id or several ids merged in the parent (e.g. disclaimer notes). */
  miaMessageId: string | string[];
}

export const initialState: WizardState = {
  currentStep: 0,
  propertyType: "private",
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
  saveInfoPremission: false,
};

// ── Step definitions ──
// 0: InitialInfoStep (property type)
// 1: CityBillStep (city + bill upload)
// 2: InitialWaiverStep
// 3: DataEntryStep
// 4: ExemptionsStep (skipped for business)
// 5: DisclaimerStep
// 6: ResultsGateStep (coupon UI inline when payment + under/overpay)
// 7: ResultsDisplayStep
// 8: AppealStep

const EXEMPTIONS_STEP = 4;

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
  | { type: 'SET_MIA_MESSAGE'; payload: string | string[] };

export function shouldSkipExemptions(state: WizardState): boolean {
  const exemptions = state.cityData?.exemptions ?? [];
  console.log('Checking if should skip exemptions step with property type', state.propertyType, 'and exemptions', exemptions);
  const type = state.propertyType; // 'private' | 'business'
  const hasRelevant = exemptions.some(
    (s: { applicableTo?: string }) => s?.applicableTo === 'both' || s.applicableTo === type,
  );
  return !hasRelevant;
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
  sx?: SxProps<Theme>;
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
  CityBillStep,
  InitialWaiverStep,
  DataEntryStep,
  ExemptionsStep,
  DisclaimerStep,
  ResultsGateStep,
  ResultsDisplayStep,
  AppealStep,
];

interface StepMeta {
  displayStep: number;
  title: string;
  subtitle?: string;
  infoMessage?: string;
  hideInfoCard?: boolean;
  layoutVariant?: 'default' | 'centered' | 'fullWidth';
  hideStepChrome?: boolean;
}

/**
 * Map internal step index → display metadata for WizardLayout.
 * Display steps: 1=Welcome, 2=Property details, 3=Exemptions, 4=Disclaimer, 5=Results.
 */
function getStepMeta(internalStep: number, propertyType: WizardState['propertyType']): StepMeta {
  switch (internalStep) {
    case 0:
      return {
        displayStep: 1,
        title: "ברוכים הבאים למחשבון הארנונה",
        subtitle: "המחשבון מנתח את נתוני הנכס שלך ומשווה אותם לתעריפים בצו הארנונה",
        infoMessage:
          "זה לוקח כמה שניות, שנתחיל? המחשבון שלנו מנתח את נתוני הנכס שלך ומשווה אותם לתעריפי צו הארנונה של הרשות המקומית. תוך שניות תקבל תוצאה וגם תוכל להגיש השגה לעירייה כדי לקבל הנחות.",
      };
    case 1:
      return {
        displayStep: 2,
        title: 'ברוכים הבאים למחשבון הארנונה',
        subtitle:
          'תוך שניות תקבל הערכה מדויקת הכוללת שימוש בפטורים והנחות.',
        infoMessage:
          'יש להעלות צילום ברור או קובץ של דו"ח ארנונה דו-חודשי, כדי שהמחשבון יוכל לחלץ את הנתונים.',
      };
    case 2:
      return {
        displayStep: 2,
        title: 'המערכת סורקת את הנתונים,',
        subtitle: 'זה יקח כמה שניות, קצת סבלנות',
        hideInfoCard: true,
        layoutVariant: 'centered',
      };
    case 3:
      return {
        displayStep: 3,
        title:
          propertyType === 'business'
            ? 'בואו נזין את פרטי העסק'
            : 'בואו נזין את פרטי הנכס',
        infoMessage:
          'המחשבון משך את הנתונים מתוך דו"ח הארנונה וודאו שהנתונים נכונים ומלאו את השדות הנותרים.',
      };
    case 4:
      return {
        displayStep: 4,
        title: 'פטורים והנחות',
        subtitle: 'האם אתה זכאי להנחות? בחרו את כל ההנחות שמתאימות לכם',
        infoMessage:
          'בואו נבדוק אם מגיעה לך הנחה על הארנונה. בחר את ההנחות הרלוונטיות מהרשימה.',
      };
    case 5:
      return {
        displayStep: 4,
        title: 'הצהרה ואישור',
        infoMessage:
          'בואו נבדוק אם מגיעה לך הנחה על הארנונה. בחר את ההנחות הרלוונטיות מהרשימה.',
      };
    case 6:
      return {
        displayStep: 5,
        title: '',
        hideInfoCard: true,
        layoutVariant: 'fullWidth',
        hideStepChrome: true,
      };
    case 7:
      return {
        displayStep: 5,
        title: '',
        hideInfoCard: true,
        layoutVariant: 'fullWidth',
        hideStepChrome: true,
      };
    case 8:
      return {
        displayStep: 5,
        title: "הכנת השגה לעירייה",
        subtitle: "מערכת ה-AI שלנו תכין עבורכם מכתב מקצועי",
        infoMessage:
          "מכתב ההשגה נכתב בנוסח מקצועי על-ידי מומחי ארנונה ומשפט. תוכלו להוריד ולשלוח לעירייה.",
      };
    default:
      return {
        displayStep: 1,
        title: "מחשבון הארנונה",
      };
  }
}

function mergeFeatures(partial?: Partial<CalculatorFeatureConfig>): CalculatorFeatureConfig {
  return { ...DEFAULT_CALCULATOR_FEATURE_CONFIG, ...partial };
}

export interface CalculatorWizardHandle {
  resetCalculator: () => void;
}

export interface CalculatorWizardProps {
  features?: Partial<CalculatorFeatureConfig>;
  onMiaMessage?: (messageId: string | string[]) => void;
  onOrdinanceUrl?: (url: { download: string; preview: string } | undefined) => void;
}

const CalculatorWizard = forwardRef<CalculatorWizardHandle, CalculatorWizardProps>(function CalculatorWizard(props, ref) {
  const features = mergeFeatures(props.features);
  const { onMiaMessage, onOrdinanceUrl } = props;
  const [state, dispatch] = useReducer(wizardReducer, initialState);

  useImperativeHandle(ref, () => ({
    resetCalculator: () => dispatch({ type: 'RESET_CALCULATOR' }),
  }));
  const ordinanceUrl = state.cityData?.ordinanceUrl as string | undefined;

  // Notify parent whenever miaMessageId changes
  useEffect(() => {
    onMiaMessage?.(state.miaMessageId);
  }, [state.miaMessageId, onMiaMessage]);

  // Notify parent whenever ordinance URL changes (after city selection)
  useEffect(() => {
    onOrdinanceUrl?.({
      download: state.cityData?.ordinanceUrl as string | undefined, preview: isVercelBlobPublicUrl(ordinanceUrl??"")
        ? `/api/view-pdf/${encodeURIComponent(state.citySlug!)}`
        : undefined
    } as { download: string; preview: string } | undefined);
  }, [state.cityData?.ordinanceUrl, onOrdinanceUrl]);

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
    state.currentStep >= EXEMPTIONS_STEP && state.currentStep <= 5
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

  // const showOrdinanceLink =
  //   Boolean(state.citySlug) && state.citySlug !== 'other' && Boolean(ordinanceUrl);
  // const ordinanceTitle =
  //   state.cityData?.cityName != null && String(state.cityData.cityName).trim() !== ''
  //     ? `צו הארנונה — ${state.cityData.cityName}`
  //     : 'צו הארנונה';

  const stepMeta = getStepMeta(state.currentStep, state.propertyType);
  const ordinancePreviewSrc =
    state.citySlug && isVercelBlobPublicUrl(ordinanceUrl ?? '')
      ? `/api/view-pdf/${encodeURIComponent(state.citySlug)}`
      : undefined;
  const ordinanceTitle =
    state.cityData?.cityName != null && String(state.cityData.cityName).trim() !== ''
      ? `צו הארנונה — ${state.cityData.cityName}`
      : 'צו הארנונה';

  return (
    <CalculatorFeaturesContext.Provider value={featuresContextValue}>
      <WizardLayout
        displayStep={stepMeta.displayStep}
        totalSteps={5}
        title={stepMeta.title}
        subtitle={stepMeta.subtitle}
        infoMessage={stepMeta.infoMessage}
        hideInfoCard={stepMeta.hideInfoCard}
        layoutVariant={stepMeta.layoutVariant}
        hideStepChrome={stepMeta.hideStepChrome}
        onResetCalculator={() => dispatch({ type: 'RESET_CALCULATOR' })}
        ordinanceDocumentUrl={ordinanceUrl}
        ordinancePreviewSrc={ordinancePreviewSrc}
        ordinanceTitle={ordinanceTitle}
      >
        {StepComponent && (
          <StepComponent
            key={state.currentStep}
            state={state}
            dispatch={dispatch}
          />
        )}
      </WizardLayout>
    </CalculatorFeaturesContext.Provider>
  );
});

export default CalculatorWizard;
