import type { DiscountType } from '@/lib/types/coupon';
import type { ISelectedExemption } from '@/lib/types/lead';

/** Coupon applied in the wizard (persists for calculator + appeal payment). */
export interface AppliedWizardCoupon {
  code: string;
  discountType: DiscountType;
  discountValue: number;
}

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
  /** UI toggle: did the user say "yes" to having a measurement error? */
  hasMeasurementError: 'yes' | 'no' | null;
  /**
   * UI toggle: did the user say the property has multiple classifications
   * (e.g. industry + residential)? If "yes" the wizard cannot run the
   * calculation automatically and redirects to ContactRedirectStep.
   */
  hasMultipleClassifications: 'yes' | 'no' | null;
  // Exemptions
  /** UI toggle: did the user say they are eligible for any exemption? */
  hasExemptions: 'yes' | 'no' | null;
  selectedExemptions: SelectedExemption[];
  householdSize: number;
  childrenCount: number;
  // Consent
  consentGiven: boolean;
  saveInfoPremission: boolean;
  // Results
  calculationResult: any | null;
  // Loading
  isLoading: boolean;
  // Tax-bill extraction
  extractionStatus: 'idle' | 'extracting' | 'success' | 'error';
  extractionError: string | null;
  // AppealStep flow phase
  appealPhase: 'idle' | 'generating' | 'finalize' | 'sign' | 'done';
  // Contact redirect reason (when calculation can't proceed)
  contactRedirectReason:
    | 'area'
    | 'designations'
    | 'multiple_classifications'
    | 'city'
    | 'other_city'
    | 'error'
    | null;
  /** Optional error detail shown when contactRedirectReason === "error" */
  contactRedirectErrorMessage: string | null;
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
  /** Mia speech bubble — single id or several ids merged in the parent. */
  miaMessageId: string | string[];
}

export const initialState: WizardState = {
  currentStep: 0,
  propertyType: 'private',
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
  hasMeasurementError: null,
  hasMultipleClassifications: null,
  hasExemptions: null,
  selectedExemptions: [],
  householdSize: 1,
  childrenCount: 0,
  consentGiven: false,
  calculationResult: null,
  isLoading: false,
  extractionStatus: 'idle',
  extractionError: null,
  appealPhase: 'idle',
  contactRedirectReason: null,
  contactRedirectErrorMessage: null,
  couponCodeDraft: '',
  appliedCoupon: null,
  additionalAreas: [],
  selectedFees: [],
  leadId: null,
  calculationIndex: 0,
  miaMessageId: 'step-0-default',
  saveInfoPremission: false,
};

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
  | {
      type: 'SET_CLASSIFICATION_ERROR';
      payload: WizardState['classificationError'];
    }
  | { type: 'SET_CALCULATION_RESULT'; payload: any }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'START_EXTRACTION' }
  | {
      type: 'APPLY_EXTRACTION_RESULT';
      payload: Record<string, { value?: unknown } | undefined>;
    }
  | { type: 'FAIL_EXTRACTION'; payload: string }
  | { type: 'RESET_EXTRACTION' }
  | { type: 'SET_APPEAL_PHASE'; payload: WizardState['appealPhase'] }
  | {
      type: 'SET_CONTACT_REDIRECT';
      payload: WizardState['contactRedirectReason'];
      errorMessage?: string;
    }
  | { type: 'SET_LEAD_ID'; payload: string }
  | { type: 'SET_CALCULATION_INDEX'; payload: number }
  | { type: 'SET_MIA_MESSAGE'; payload: string | string[] };
