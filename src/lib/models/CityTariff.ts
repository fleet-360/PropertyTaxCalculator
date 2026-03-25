import mongoose, { Schema, Document, Model } from 'mongoose';

export { ALL_ZONES_TARIFF_CODE, ALL_ZONES_LABEL_HE } from '@/lib/tariff-constants';

// ── Size range sub-document interface ────────────────────────────────
export interface ISizeRange {
  min: number;
  max: number;
  rate: number;
  propertyCode?: string;
}

// ── Zone rate sub-document interface ─────────────────────────────────
export interface IZoneRate {
  zone: string;
  zoneLabel: string;
  rate?: number;
  sizeRanges?: ISizeRange[];
  propertyCode?: string;
}

// ── Sub-type sub-document interface ──────────────────────────────────
export interface ISubType {
  code: string;
  label: string;
  hasSizeRanges: boolean;
  /** When true, size ranges use progressive (bracket/cumulative) pricing;
   *  when false, a single flat rate applies to the entire area based on which range it falls into. */
  isProgressiveRate: boolean;
  zones: IZoneRate[];
}

// ── Property type sub-document interface ─────────────────────────────
export interface IPropertyType {
  category: "private" | "business";
  code: string;
  label: string;
  subtypes: ISubType[];
}

// ── Exemption restrictions sub-document interface ────────────────────
export interface IExemptionRestrictions {
  maxAreaSqm?: number;
  minChildren?: number;
  minHouseholdSize?: number;
}

// ── Exemption sub-section sub-document interface ─────────────────────
export interface IExemptionSubSection {
  code: string;
  description: string;
  discountPercent: number;
  restrictions: IExemptionRestrictions;
  requiresDocuments: boolean;
  documentTypes: string[];
}

// ── Exemption section sub-document interface ─────────────────────────
export interface IExemptionSection {
  sectionCode: string;
  sectionLabel: string;
  subSections: IExemptionSubSection[];
}

// ── Available zone sub-document interface ────────────────────────────
export interface IAvailableZone {
  code: string;
  label: string;
}

// ── City tariff document interface ───────────────────────────────────
export interface ICityTariff extends Document {
  cityName: string;
  cityNameEn: string;
  slug: string;
  year: number;
  isActive: boolean;
  ordinanceUrl?: string;
  types: IPropertyType[];
  exemptions: IExemptionSection[];
  availableZones: IAvailableZone[];
  createdAt: Date;
  updatedAt: Date;
}

// ── Size range schema ────────────────────────────────────────────────
const SizeRangeSchema = new Schema<ISizeRange>(
  {
    min: { type: Number, required: true },
    max: { type: Number, required: true },
    rate: { type: Number, required: true },
    propertyCode: { type: String },
  },
  { _id: false }
);

// ── Zone rate schema ─────────────────────────────────────────────────
const ZoneRateSchema = new Schema<IZoneRate>(
  {
    zone: { type: String, required: true },
    zoneLabel: { type: String, required: true },
    rate: { type: Number },
    sizeRanges: { type: [SizeRangeSchema], default: undefined },
    propertyCode: { type: String },
  },
  { _id: false }
);

// ── Sub-type schema ──────────────────────────────────────────────────
const SubTypeSchema = new Schema<ISubType>(
  {
    code: { type: String, required: true },
    label: { type: String, required: true },
    hasSizeRanges: { type: Boolean, default: false },
    isProgressiveRate: { type: Boolean, default: false },
    zones: { type: [ZoneRateSchema], default: [] },
  },
  { _id: false }
);

// ── Property type schema ─────────────────────────────────────────────
const PropertyTypeSchema = new Schema<IPropertyType>(
  {
    category: {
      type: String,
      enum: ['private', 'business'],
      required: true,
    },
    code: { type: String, required: true },
    label: { type: String, required: true },
    subtypes: { type: [SubTypeSchema], default: [] },
  },
  { _id: false }
);

// ── Exemption restrictions schema ────────────────────────────────────
const ExemptionRestrictionsSchema = new Schema<IExemptionRestrictions>(
  {
    maxAreaSqm: { type: Number },
    minChildren: { type: Number },
    minHouseholdSize: { type: Number },
  },
  { _id: false }
);

// ── Exemption sub-section schema ─────────────────────────────────────
const ExemptionSubSectionSchema = new Schema<IExemptionSubSection>(
  {
    code: { type: String, required: true },
    description: { type: String, required: true },
    discountPercent: { type: Number, required: true },
    restrictions: { type: ExemptionRestrictionsSchema, default: {} },
    requiresDocuments: { type: Boolean, default: false },
    documentTypes: [{ type: String }],
  },
  { _id: false }
);

// ── Exemption section schema ─────────────────────────────────────────
const ExemptionSectionSchema = new Schema<IExemptionSection>(
  {
    sectionCode: { type: String, required: true },
    sectionLabel: { type: String, required: true },
    subSections: { type: [ExemptionSubSectionSchema], default: [] },
  },
  { _id: false }
);

// ── Available zone schema ────────────────────────────────────────────
const AvailableZoneSchema = new Schema<IAvailableZone>(
  {
    code: { type: String, required: true },
    label: { type: String, required: true },
  },
  { _id: false }
);

// ── City tariff schema ───────────────────────────────────────────────
const CityTariffSchema = new Schema<ICityTariff>(
  {
    cityName: {
      type: String,
      required: [true, 'City name is required'],
      trim: true,
    },
    cityNameEn: {
      type: String,
      required: [true, 'City name (English) is required'],
      trim: true,
    },
    slug: {
      type: String,
      required: [true, 'Slug is required'],
      trim: true,
      lowercase: true,
    },
    year: {
      type: Number,
      required: [true, 'Year is required'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    ordinanceUrl: {
      type: String,
    },
    types: { type: [PropertyTypeSchema], default: [] },
    exemptions: { type: [ExemptionSectionSchema], default: [] },
    availableZones: { type: [AvailableZoneSchema], default: [] },
  },
  {
    timestamps: true,
  }
);

// ── Indexes ───────────────────────────────────────────────────────────
CityTariffSchema.index({ slug: 1, year: 1 }, { unique: true });
CityTariffSchema.index({ isActive: 1 });

// ── Model export (handle hot-reload in Next.js dev) ───────────────────
const CityTariff: Model<ICityTariff> =
  (mongoose.models.CityTariff as Model<ICityTariff>) || mongoose.model<ICityTariff>('CityTariff', CityTariffSchema);

export default CityTariff;
