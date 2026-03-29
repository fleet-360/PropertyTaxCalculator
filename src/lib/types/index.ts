/**
 * Barrel re-export for all shared domain types.
 *
 * Usage: import { ISizeRange, TaxCalculationInput, ... } from '@/lib/types';
 */

export type {
  ISizeRange,
  IZoneRate,
  ISubType,
  IPropertyType,
  IExemptionRestrictions,
  IExemptionSubSection,
  IExemptionSection,
  IAvailableZone,
  ICityTariffData,
} from './city-tariff';

export type {
  IBlockParcel,
  IDesignation,
  ICalculationResult,
  ISelectedExemption,
  IUploadedDocument,
  IMeasurementError,
  IClassificationError,
  IErrorReport,
  IPaymentTransaction,
  IAppealDocument,
} from './customer';

export type {
  TaxCalculationInput,
  TaxCalculationResult,
  RateResult,
} from './calculator';

export type {
  IBlock,
  ISeo,
  IContent,
  PostStatus,
  SeoData,
  PostData,
  PostListItem,
  PostsResponse,
  SeoCheck,
  PostEditorProps,
  PostSortField,
  SortDirection,
} from './post';

export type {
  LeadSource,
  LeadStatus,
  CalculationStatus,
  AbandonmentStage,
  ICalculationEntry,
  ILeadData,
} from './lead';

export type {
  DiscountType,
  ICouponData,
  CouponFormData,
} from './coupon';

export type {
  CalculatorFeatureConfig,
  IContactEmails,
  ISystemConfigData,
} from './system-config';

export {
  DEFAULT_CALCULATOR_FEATURE_CONFIG,
  DEFAULT_MATCH_TOLERANCE_IS_PERCENT,
  DEFAULT_MATCH_TOLERANCE_VALUE,
  parseMatchToleranceFromConfig,
  toCalculatorFeatureConfig,
} from './system-config';

export type {
  ISettingsData,
} from './settings';

export type {
  CitySummary,
  PaymentStatus,
  LeadListItem,
  StatCardProps,
} from './admin';
