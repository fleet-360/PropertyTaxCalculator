/**
 * Shared plain-data interfaces for the Lead domain.
 *
 * A Lead is the unified entity that replaces both Customer and ContactRequest.
 * It starts as an inquiry (contact_form / articles) or a lead from the calculator.
 */

import type {
  IBlockParcel,
  IDesignation,
  ICalculationResult,
  ISelectedExemption,
  IUploadedDocument,
  IErrorReport,
  IPaymentTransaction,
  IAppealDocument,
} from './customer';

// Re-export sub-document types for convenience
export type {
  IBlockParcel,
  IDesignation,
  ICalculationResult,
  ISelectedExemption,
  IUploadedDocument,
  IErrorReport,
  IPaymentTransaction,
  IAppealDocument,
} from './customer';

// ── Lead source (how the lead arrived) ──────────────────────────────
export type LeadSource = 'calculator' | 'contact_form' | 'articles';

// ── Lead status (CRM / management) ──────────────────────────────────
export type LeadStatus = 'new' | 'contacted' | 'closed';

// ── Contact redirect reason (when abandonmentStage === 'contact_redirect') ─
export type ContactRedirectReason =
  | 'area'
  | 'designations'
  | 'multiple_classifications'
  | 'city'
  | 'other_city'
  | 'error';

// ── Abandonment stage (per calculation — wizard step where user stopped) ─
export type AbandonmentStage =
  | 'initial_info'
  | 'initial_waiver'
  | 'data_entry'
  | 'exemptions'
  | 'disclaimer'
  | 'results_gate'
  | 'results_display'
  | 'appeal'
  | 'contact_redirect'
  | 'completed';

// ── Calculation entry (one item in the calculations[] array) ────────
export interface ICalculationEntry {
  // Abandonment tracking
  abandonmentStage: AbandonmentStage;
  contactRedirectReason?: ContactRedirectReason;

  // Property details (snapshot at time of calculation)
  propertyType?: 'private' | 'business';
  citySlug?: string;
  propertyNumber?: string;
  propertyId?: string;
  address?: string;
  blockParcel?: IBlockParcel;
  propertyArea?: number;
  coveredBalconyArea?: number;
  storageArea?: number;
  parkingArea?: number;
  classificationCode?: string;
  zone?: string;
  bimonthlyPayment?: number;

  // Business designations
  designations?: IDesignation[];

  // Calculation result
  calculationResult?: ICalculationResult;

  // Exemptions
  selectedExemptions?: ISelectedExemption[];
  householdSize?: number;
  childrenCount?: number;

  // Error reports
  errorReport?: IErrorReport;

  // Payment (per calculation)
  paymentStatus?: 'none' | 'calculator_paid' | 'appeal_paid';
  paymentTransactions?: IPaymentTransaction[];

  // Timestamp
  createdAt: Date | string;
}

// ── Lead data (plain, no Mongoose Document) ─────────────────────────
export interface ILeadData {
  _id: string;

  // Personal details
  fullName: string;
  phone: string;
  email?: string;
  idNumber?: string;

  // Lead management
  source: LeadSource;
  status: LeadStatus;
  message?: string;

  // Payment & appeal (global to lead)
  paymentStatus: 'none' | 'calculator_paid' | 'appeal_paid';
  paymentTransactions?: IPaymentTransaction[];
  appealDocument?: IAppealDocument;
  uploadedDocuments?: IUploadedDocument[];
  consentTimestamp?: string;

  // Calculations history
  calculations: ICalculationEntry[];

  // Timestamps
  createdAt: string;
  updatedAt: string;
}
