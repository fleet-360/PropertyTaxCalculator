import mongoose, { Schema, Document, Model } from 'mongoose';
import type { ConsentType } from '@/lib/types/consent';

// ── ConsentRecord document interface ────────────────────────────────
export interface IConsentRecordDoc extends Document {
  leadId?: mongoose.Types.ObjectId;
  phone: string;
  consentType: ConsentType;
  consentVersion: string;
  consentTextHash: string;
  consentText: string;
  accepted: boolean;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
}

// ── Schema ──────────────────────────────────────────────────────────
const ConsentRecordSchema = new Schema<IConsentRecordDoc>(
  {
    leadId: { type: Schema.Types.ObjectId, ref: 'Lead' },
    phone: { type: String, required: true, trim: true },
    consentType: {
      type: String,
      enum: ['data_retention', 'legal_disclaimer'],
      required: true,
    },
    consentVersion: { type: String, required: true },
    consentTextHash: { type: String, required: true },
    consentText: { type: String, required: true },
    accepted: { type: Boolean, required: true },
    ipAddress: { type: String, required: true },
    userAgent: { type: String, required: true },
    timestamp: { type: Date, required: true },
  },
  {
    timestamps: false,
  }
);

// ── Indexes ─────────────────────────────────────────────────────────
ConsentRecordSchema.index({ phone: 1 });
ConsentRecordSchema.index({ leadId: 1 });
ConsentRecordSchema.index({ timestamp: -1 });
ConsentRecordSchema.index({ consentType: 1, consentVersion: 1 });

// ── Model export (handle hot-reload in Next.js dev) ─────────────────
const ConsentRecord: Model<IConsentRecordDoc> =
  mongoose.models.ConsentRecord ||
  mongoose.model<IConsentRecordDoc>('ConsentRecord', ConsentRecordSchema);

export default ConsentRecord;
