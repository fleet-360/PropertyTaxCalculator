import mongoose, { Schema, Document, Model } from 'mongoose';

// ── AI Prompt document interface ─────────────────────────────────────
export interface IAiPrompt extends Document {
  key: string;
  category: string;
  label: string;
  description: string;
  content: string;
  templateVariables: string[];
  isActive: boolean;
  version: number;
  lastModifiedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// ── Static methods interface ─────────────────────────────────────────
interface IAiPromptModel extends Model<IAiPrompt> {
  getByKey(key: string): Promise<IAiPrompt | null>;
}

// ── Schema ───────────────────────────────────────────────────────────
const AiPromptSchema = new Schema<IAiPrompt>(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    label: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    content: {
      type: String,
      required: true,
    },
    templateVariables: {
      type: [String],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    version: {
      type: Number,
      default: 1,
    },
    lastModifiedBy: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  },
);

// ── Index ────────────────────────────────────────────────────────────
AiPromptSchema.index({ category: 1, key: 1 });

// ── Auto-increment version on save ──────────────────────────────────
AiPromptSchema.pre('save', function () {
  if (!this.isNew && this.isModified('content')) {
    this.version = (this.version || 1) + 1;
  }
});

// ── Static: getByKey ─────────────────────────────────────────────────
AiPromptSchema.statics.getByKey = async function (key: string): Promise<IAiPrompt | null> {
  return this.findOne({ key, isActive: true }).lean();
};

// ── Model export (handle hot-reload in Next.js dev) ──────────────────
const AiPrompt: IAiPromptModel =
  (mongoose.models.AiPrompt as IAiPromptModel) ||
  mongoose.model<IAiPrompt, IAiPromptModel>('AiPrompt', AiPromptSchema);

export default AiPrompt;
