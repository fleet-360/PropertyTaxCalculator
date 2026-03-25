/**
 * Shared plain-data interfaces for the Customer domain.
 *
 * These are the single source of truth for customer sub-document structures.
 * The Mongoose model (`src/lib/models/Customer.ts`) and all consumers
 * import from here.
 */

// ── Block-parcel sub-document interface ──────────────────────────────
export interface IBlockParcel {
  block: string;
  parcel: string;
}

// ── Designation sub-document interface ───────────────────────────────
export interface IDesignation {
  type: string;
  area: number;
}

// ── Calculation result sub-document interface ────────────────────────
export interface ICalculationResult {
  ratePerSqm: number;
  calculatedBimonthly: number;
  calculatedAnnual: number;
  savings: number;
  savingsAnnual: number;
  savings10Year: number;
  outcome: 'match' | 'overpaying' | 'underpaying';
}

// ── Selected exemption sub-document interface ────────────────────────
export interface ISelectedExemption {
  sectionCode: string;
  subSectionCode: string;
}

// ── Uploaded document sub-document interface ─────────────────────────
export interface IUploadedDocument {
  type: string;
  url: string;
  uploadedAt: Date;
}

// ── Measurement error sub-document interface ─────────────────────────
export interface IMeasurementError {
  claimedArea: number;
  attachmentUrl?: string;
}

// ── Classification error sub-document interface ──────────────────────
export interface IClassificationError {
  suggestedClassification: string;
}

// ── Error report sub-document interface ──────────────────────────────
export interface IErrorReport {
  measurementError?: IMeasurementError;
  classificationError?: IClassificationError;
}

// ── Payment transaction sub-document interface ───────────────────────
export interface IPaymentTransaction {
  amount: number;
  type: string;
  transactionId: string;
  date: Date;
}

// ── Appeal document sub-document interface ───────────────────────────
export interface IAppealDocument {
  url: string;
  generatedAt: Date;
  sentAt?: Date;
}
