import mongoose, { Schema, Document, Model } from 'mongoose';
import {
  type IAppealLetterSampleStored,
  type IContactEmails,
  DEFAULT_MATCH_TOLERANCE_IS_PERCENT,
  DEFAULT_MATCH_TOLERANCE_VALUE,
} from '@/lib/types/system-config';

// Re-export shared types so existing consumers don't break
export type { IContactEmails } from '@/lib/types/system-config';

// ── System config document interface ─────────────────────────────────
export interface ISystemConfig extends Document {
  paymentEnabled: boolean;
  systemEnabled: boolean;
  calculatorPrice: number;
  appealPrice: number;
  matchToleranceValue: number;
  matchToleranceIsPercent: boolean;
  contactEmails?: IContactEmails;
  appealLetterSamples?: IAppealLetterSampleStored[];
  createdAt: Date;
  updatedAt: Date;
}

// ── Static methods interface ─────────────────────────────────────────
interface ISystemConfigModel extends Model<ISystemConfig> {
  getConfig(): Promise<ISystemConfig>;
}

// ── Contact emails schema ────────────────────────────────────────────
const ContactEmailsSchema = new Schema<IContactEmails>(
  {
    service: { type: String, trim: true },
    noreply: { type: String, trim: true },
    calculator: { type: String, trim: true },
  },
  { _id: false }
);

// ── Appeal letter sample slot schema ─────────────────────────────────
const AppealLetterSampleSchema = new Schema<IAppealLetterSampleStored>(
  {
    slot: { type: Number, required: true, min: 1, max: 3 },
    pathname: { type: String, required: true, trim: true },
    blobUrl: { type: String, required: true, trim: true },
    originalFilename: { type: String, required: true, trim: true },
    mimeType: { type: String, default: 'application/pdf', trim: true },
    updatedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

// ── System config schema ─────────────────────────────────────────────
const SystemConfigSchema = new Schema<ISystemConfig>(
  {
    paymentEnabled: {
      type: Boolean,
      default: true,
    },
    systemEnabled: {
      type: Boolean,
      default: true,
    },
    calculatorPrice: {
      type: Number,
      default: 34,
    },
    appealPrice: {
      type: Number,
      default: 180,
    },
    matchToleranceValue: {
      type: Number,
      default: DEFAULT_MATCH_TOLERANCE_VALUE,
      min: 0,
    },
    matchToleranceIsPercent: {
      type: Boolean,
      default: DEFAULT_MATCH_TOLERANCE_IS_PERCENT,
    },
    contactEmails: {
      type: ContactEmailsSchema,
    },
    appealLetterSamples: {
      type: [AppealLetterSampleSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// ── Static method: getConfig (singleton pattern) ─────────────────────
// Returns the single config document, creating one with defaults if
// none exists yet.
SystemConfigSchema.statics.getConfig = async function (): Promise<ISystemConfig> {
  let config = await this.findOne();

  if (!config) {
    config = await this.create({});
  }

  return config;
};

// ── Model export (handle hot-reload in Next.js dev) ───────────────────
const SystemConfig: ISystemConfigModel =
  (mongoose.models.SystemConfig as ISystemConfigModel) ||
  mongoose.model<ISystemConfig, ISystemConfigModel>('SystemConfig', SystemConfigSchema);

export default SystemConfig;
