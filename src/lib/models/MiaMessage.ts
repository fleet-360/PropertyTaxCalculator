import mongoose, { Schema, Document, Model } from 'mongoose';
import type { IMiaMessageData } from '@/lib/types/mia-message';

// ── MiaMessage document interface ────────────────────────────────────
export interface IMiaMessage extends Document, Omit<IMiaMessageData, '_id'> {
  createdAt: Date;
  updatedAt: Date;
}

// ── Schema ───────────────────────────────────────────────────────────
const MiaMessageSchema = new Schema<IMiaMessage>(
  {
    messageId: {
      type: String,
      required: true,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

MiaMessageSchema.index({ messageId: 1 }, { unique: true });

// ── Model export (handle hot-reload in Next.js dev) ──────────────────
const MiaMessage: Model<IMiaMessage> =
  (mongoose.models.MiaMessage as Model<IMiaMessage>) ||
  mongoose.model<IMiaMessage>('MiaMessage', MiaMessageSchema);

export default MiaMessage;
