import mongoose, { Schema, Document, Model } from 'mongoose';

// ── Contact request document interface ───────────────────────────────
export interface IContactRequest extends Document {
  name: string;
  phone: string;
  email?: string;
  message?: string;
  source: 'calculator_business' | 'landing_page' | 'appeal';
  status: 'new' | 'contacted' | 'closed';
  createdAt: Date;
  updatedAt: Date;
}

// ── Contact request schema ───────────────────────────────────────────
const ContactRequestSchema = new Schema<IContactRequest>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone is required'],
      trim: true,
    },
    email: {
      type: String,
      trim: true,
    },
    message: {
      type: String,
      trim: true,
    },
    source: {
      type: String,
      enum: ['calculator_business', 'landing_page', 'appeal'],
      required: [true, 'Source is required'],
    },
    status: {
      type: String,
      enum: ['new', 'contacted', 'closed'],
      default: 'new',
    },
  },
  {
    timestamps: true,
  }
);

// ── Indexes ───────────────────────────────────────────────────────────
ContactRequestSchema.index({ status: 1 });
ContactRequestSchema.index({ createdAt: -1 });

// ── Model export (handle hot-reload in Next.js dev) ───────────────────
const ContactRequest: Model<IContactRequest> =
  mongoose.models.ContactRequest || mongoose.model<IContactRequest>('ContactRequest', ContactRequestSchema);

export default ContactRequest;
