import mongoose, { Schema, Document, Model } from 'mongoose';

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

// ── Customer document interface ──────────────────────────────────────
export interface ICustomer extends Document {
  fullName: string;
  idNumber: string;
  email?: string;
  phone?: string;
  propertyType: 'private' | 'business';
  citySlug: string;
  propertyNumber?: string;
  propertyId?: string;
  address?: string;
  blockParcel?: IBlockParcel;
  propertyArea: number;
  coveredBalconyArea?: number;
  storageArea?: number;
  parkingArea?: number;
  classificationCode?: string;
  zone?: string;
  bimonthlyPayment: number;
  // Business
  designations?: IDesignation[];
  // Calculation
  calculationResult?: ICalculationResult;
  // Exemptions
  selectedExemptions?: ISelectedExemption[];
  householdSize?: number;
  childrenCount?: number;
  uploadedDocuments?: IUploadedDocument[];
  // Consent
  consentTimestamp?: Date;
  // Error reports
  errorReport?: IErrorReport;
  // Payment
  paymentStatus: 'none' | 'calculator_paid' | 'appeal_paid';
  paymentTransactions?: IPaymentTransaction[];
  // Appeal
  appealDocument?: IAppealDocument;
  status: 'in_progress' | 'match' | 'overpaying' | 'underpaying' | 'appeal_filed';
  createdAt: Date;
  updatedAt: Date;
}

// ── Block-parcel schema ──────────────────────────────────────────────
const BlockParcelSchema = new Schema<IBlockParcel>(
  {
    block: { type: String, required: true },
    parcel: { type: String, required: true },
  },
  { _id: false }
);

// ── Designation schema ───────────────────────────────────────────────
const DesignationSchema = new Schema<IDesignation>(
  {
    type: { type: String, required: true },
    area: { type: Number, required: true },
  },
  { _id: false }
);

// ── Calculation result schema ────────────────────────────────────────
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

// ── Selected exemption schema ────────────────────────────────────────
const SelectedExemptionSchema = new Schema<ISelectedExemption>(
  {
    sectionCode: { type: String, required: true },
    subSectionCode: { type: String, required: true },
  },
  { _id: false }
);

// ── Uploaded document schema ─────────────────────────────────────────
const UploadedDocumentSchema = new Schema<IUploadedDocument>(
  {
    type: { type: String, required: true },
    url: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

// ── Measurement error schema ─────────────────────────────────────────
const MeasurementErrorSchema = new Schema<IMeasurementError>(
  {
    claimedArea: { type: Number, required: true },
    attachmentUrl: { type: String },
  },
  { _id: false }
);

// ── Classification error schema ──────────────────────────────────────
const ClassificationErrorSchema = new Schema<IClassificationError>(
  {
    suggestedClassification: { type: String, required: true },
  },
  { _id: false }
);

// ── Error report schema ──────────────────────────────────────────────
const ErrorReportSchema = new Schema<IErrorReport>(
  {
    measurementError: { type: MeasurementErrorSchema },
    classificationError: { type: ClassificationErrorSchema },
  },
  { _id: false }
);

// ── Payment transaction schema ───────────────────────────────────────
const PaymentTransactionSchema = new Schema<IPaymentTransaction>(
  {
    amount: { type: Number, required: true },
    type: { type: String, required: true },
    transactionId: { type: String, required: true },
    date: { type: Date, required: true },
  },
  { _id: false }
);

// ── Appeal document schema ───────────────────────────────────────────
const AppealDocumentSchema = new Schema<IAppealDocument>(
  {
    url: { type: String, required: true },
    generatedAt: { type: Date, required: true },
    sentAt: { type: Date },
  },
  { _id: false }
);

// ── Customer schema ──────────────────────────────────────────────────
const CustomerSchema = new Schema<ICustomer>(
  {
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
    },
    idNumber: {
      type: String,
      required: [true, 'ID number is required'],
      trim: true,
    },
    email: {
      type: String,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    propertyType: {
      type: String,
      enum: ['private', 'business'],
      required: [true, 'Property type is required'],
    },
    citySlug: {
      type: String,
      required: [true, 'City slug is required'],
      trim: true,
      lowercase: true,
    },
    propertyNumber: {
      type: String,
      trim: true,
    },
    propertyId: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    blockParcel: {
      type: BlockParcelSchema,
    },
    propertyArea: {
      type: Number,
      required: [true, 'Property area is required'],
    },
    coveredBalconyArea: {
      type: Number,
    },
    storageArea: {
      type: Number,
    },
    parkingArea: {
      type: Number,
    },
    classificationCode: {
      type: String,
    },
    zone: {
      type: String,
    },
    bimonthlyPayment: {
      type: Number,
      required: [true, 'Bimonthly payment is required'],
    },
    // Business
    designations: { type: [DesignationSchema], default: undefined },
    // Calculation
    calculationResult: {
      type: CalculationResultSchema,
    },
    // Exemptions
    selectedExemptions: { type: [SelectedExemptionSchema], default: undefined },
    householdSize: {
      type: Number,
    },
    childrenCount: {
      type: Number,
    },
    uploadedDocuments: { type: [UploadedDocumentSchema], default: undefined },
    // Consent
    consentTimestamp: {
      type: Date,
    },
    // Error reports
    errorReport: {
      type: ErrorReportSchema,
    },
    // Payment
    paymentStatus: {
      type: String,
      enum: ['none', 'calculator_paid', 'appeal_paid'],
      default: 'none',
    },
    paymentTransactions: { type: [PaymentTransactionSchema], default: undefined },
    // Appeal
    appealDocument: {
      type: AppealDocumentSchema,
    },
    status: {
      type: String,
      enum: ['in_progress', 'match', 'overpaying', 'underpaying', 'appeal_filed'],
      default: 'in_progress',
    },
  },
  {
    timestamps: true,
  }
);

// ── Indexes ───────────────────────────────────────────────────────────
CustomerSchema.index({ citySlug: 1 });
CustomerSchema.index({ status: 1 });
CustomerSchema.index({ createdAt: -1 });

// ── Model export (handle hot-reload in Next.js dev) ───────────────────
const Customer: Model<ICustomer> =
  mongoose.models.Customer || mongoose.model<ICustomer>('Customer', CustomerSchema);

export default Customer;
