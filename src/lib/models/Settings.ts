import mongoose, { Schema, Document, Model } from 'mongoose';

// ── Settings document interface ───────────────────────────────────────
export interface ISettings extends Document {
  siteName: string;
  siteDescription?: string;
  defaultAuthor: string;
  postsPerPage: number;
  defaultOgImage?: string;
  googleAnalyticsId?: string;
  customHeadCode?: string;
  customCss?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ── Static methods interface ──────────────────────────────────────────
interface ISettingsModel extends Model<ISettings> {
  getSettings(): Promise<ISettings>;
}

// ── Settings schema ───────────────────────────────────────────────────
const SettingsSchema = new Schema<ISettings>(
  {
    siteName: {
      type: String,
      default: 'My Blog',
      trim: true,
    },
    siteDescription: {
      type: String,
      trim: true,
    },
    defaultAuthor: {
      type: String,
      default: 'Admin',
      trim: true,
    },
    postsPerPage: {
      type: Number,
      default: 10,
      min: 1,
      max: 100,
    },
    defaultOgImage: {
      type: String,
    },
    googleAnalyticsId: {
      type: String,
      trim: true,
    },
    customHeadCode: {
      type: String,
    },
    customCss: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// ── Static method: getSettings (singleton pattern) ────────────────────
// Returns the single settings document, creating one with defaults if
// none exists yet.
SettingsSchema.statics.getSettings = async function (): Promise<ISettings> {
  let settings = await this.findOne();

  if (!settings) {
    settings = await this.create({});
  }

  return settings;
};

// ── Model export (handle hot-reload in Next.js dev) ───────────────────
const Settings: ISettingsModel =
  (mongoose.models.Settings as ISettingsModel) ||
  mongoose.model<ISettings, ISettingsModel>('Settings', SettingsSchema);

export default Settings;
