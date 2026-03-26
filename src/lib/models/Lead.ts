import mongoose, { Schema, Document, Model } from 'mongoose';
import type {
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
} from '@/lib/types/customer';
import type {
  LeadSource,
  LeadStatus,
  CalculationStatus,
  AbandonmentStage,
  ICalculationEntry,
} from '@/lib/types/lead';

// Re-export types for convenience
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
} from '@/lib/types/customer';

export type {
  LeadSource,
  LeadStatus,
  CalculationStatus,
  AbandonmentStage,
  ICalculationEntry,
} from '@/lib/types/lead';

// ── Lead document interface ──────────────────────────────────────────
export interface ILead extends Document {
  // Personal details
  fullName: string;
  phone: string;
  email?: string;
  idNumber?: string;

  // Lead management
  source: LeadSource;
  status: LeadStatus;
  message?: string;

  // Payment & appeal (global)
  paymentStatus: 'none' | 'calculator_paid' | 'appeal_paid';
  paymentTransactions?: IPaymentTransaction[];
  appealDocument?: IAppealDocument;
  uploadedDocuments?: IUploadedDocument[];
  consentTimestamp?: Date;

  // Calculations history
  calculations: ICalculationEntry[];

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

// ── Sub-schemas ──────────────────────────────────────────────────────

const BlockParcelSchema = new Schema<IBlockParcel>(
  {
    block: { type: String, required: true },
    parcel: { type: String, required: true },
  },
  { _id: false }
);

const DesignationSchema = new Schema<IDesignation>(
  {
    type: { type: String, required: true },
    area: { type: Number, required: true },
  },
  { _id: false }
);

const CalculationResultSchema = new Schema<ICalculationResult>(
  {
    ratePerSqm: { type: Number, required: true },
    calculatedBimonthly: { type: Number, required: true },
    calculatedAnnual: { type: Number, required: true },
    savings: { type: Number, required: true },
    savingsAnnual: { type: Number, required: true },
    savings10Year: { type: Number, required: true },
    outcome: {
      type: String,
      enum: ['match', 'overpaying', 'underpaying'],
      required: true,
    },
  },
  { _id: false }
);

const SelectedExemptionSchema = new Schema<ISelectedExemption>(
  {
    sectionCode: { type: String, required: true },
    subSectionCode: { type: String, required: true },
  },
  { _id: false }
);

const UploadedDocumentSchema = new Schema<IUploadedDocument>(
  {
    type: { type: String, required: true },
    url: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const MeasurementErrorSchema = new Schema<IMeasurementError>(
  {
    claimedArea: { type: Number, required: true },
    attachmentUrl: { type: String },
  },
  { _id: false }
);

const ClassificationErrorSchema = new Schema<IClassificationError>(
  {
    suggestedClassification: { type: String, required: true },
  },
  { _id: false }
);

const ErrorReportSchema = new Schema<IErrorReport>(
  {
    measurementError: { type: MeasurementErrorSchema },
    classificationError: { type: ClassificationErrorSchema },
  },
  { _id: false }
);

const PaymentTransactionSchema = new Schema<IPaymentTransaction>(
  {
    amount: { type: Number, required: true },
    type: { type: String, required: true },
    transactionId: { type: String, required: true },
    date: { type: Date, required: true },
  },
  { _id: false }
);

const AppealDocumentSchema = new Schema<IAppealDocument>(
  {
    url: { type: String, required: true },
    generatedAt: { type: Date, required: true },
    sentAt: { type: Date },
  },
  { _id: false }
);

// ── Calculation entry sub-schema ─────────────────────────────────────
const CalculationEntrySchema = new Schema<ICalculationEntry>(
  {
    // Abandonment tracking
    abandonmentStage: {
      type: String,
      enum: [
        'initial_info',
        'initial_waiver',
        'data_entry',
        'exemptions',
        'disclaimer',
        'results_gate',
        'results_display',
        'appeal',
        'contact_redirect',
        'completed',
      ],
      default: 'data_entry',
    },

    // Property details
    propertyType: {
      type: String,
      enum: ['private', 'business'],
    },
    citySlug: {
      type: String,
      trim: true,
      lowercase: true,
    },
    propertyNumber: { type: String, trim: true },
    propertyId: { type: String, trim: true },
    address: { type: String, trim: true },
    blockParcel: { type: BlockParcelSchema },
    propertyArea: { type: Number },
    coveredBalconyArea: { type: Number },
    storageArea: { type: Number },
    parkingArea: { type: Number },
    classificationCode: { type: String },
    zone: { type: String },
    bimonthlyPayment: { type: Number },

    // Business designations
    designations: { type: [DesignationSchema], default: undefined },

    // Calculation result
    calculationStatus: {
      type: String,
      enum: ['in_progress', 'match', 'overpaying', 'underpaying', 'appeal_filed'],
    },
    calculationResult: { type: CalculationResultSchema },

    // Exemptions
    selectedExemptions: { type: [SelectedExemptionSchema], default: undefined },
    householdSize: { type: Number },
    childrenCount: { type: Number },

    // Error reports
    errorReport: { type: ErrorReportSchema },

    // Timestamp
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

// ── Lead schema ──────────────────────────────────────────────────────
const LeadSchema = new Schema<ILead>(
  {
    // Personal details
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone is required'],
      trim: true,
      unique: true,
    },
    email: {
      type: String,
      trim: true,
    },
    idNumber: {
      type: String,
      trim: true,
    },

    // Lead management
    source: {
      type: String,
      enum: ['calculator', 'contact_form', 'articles'],
      required: [true, 'Source is required'],
    },
    status: {
      type: String,
      enum: ['new', 'contacted', 'closed'],
      default: 'new',
    },
    message: {
      type: String,
      trim: true,
    },

    // Payment & appeal (global)
    paymentStatus: {
      type: String,
      enum: ['none', 'calculator_paid', 'appeal_paid'],
      default: 'none',
    },
    paymentTransactions: { type: [PaymentTransactionSchema], default: undefined },
    appealDocument: { type: AppealDocumentSchema },
    uploadedDocuments: { type: [UploadedDocumentSchema], default: undefined },
    consentTimestamp: { type: Date },

    // Calculations history
    calculations: { type: [CalculationEntrySchema], default: [] },
  },
  {
    timestamps: true,
  }
);

// ── Indexes ──────────────────────────────────────────────────────────
// phone unique index is already set via `unique: true` on the field
LeadSchema.index({ status: 1 });
LeadSchema.index({ source: 1 });
LeadSchema.index({ createdAt: -1 });
LeadSchema.index({ 'calculations.abandonmentStage': 1 });
LeadSchema.index({ 'calculations.citySlug': 1 });

// ── Model export (handle hot-reload in Next.js dev) ──────────────────
const Lead: Model<ILead> =
  mongoose.models.Lead || mongoose.model<ILead>('Lead', LeadSchema);

export default Lead;
