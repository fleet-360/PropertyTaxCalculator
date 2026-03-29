import mongoose, { Schema, Document, Model } from 'mongoose';

// ── Coupon document interface ────────────────────────────────────────
export interface ICoupon extends Document {
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  isOneTimeUse: boolean;
  usedBy?: mongoose.Types.ObjectId;
  usedAt?: Date;
  isActive: boolean;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ── Coupon schema ────────────────────────────────────────────────────
const CouponSchema = new Schema<ICoupon>(
  {
    code: {
      type: String,
      required: [true, 'Coupon code is required'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    discountType: {
      type: String,
      enum: ['percentage', 'fixed'],
      required: [true, 'Discount type is required'],
    },
    discountValue: {
      type: Number,
      required: [true, 'Discount value is required'],
    },
    isOneTimeUse: {
      type: Boolean,
      default: true,
    },
    usedBy: {
      type: Schema.Types.ObjectId,
      ref: 'Customer',
    },
    usedAt: {
      type: Date,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    expiresAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);


// ── Pre-save hook: uppercase the code ────────────────────────────────
CouponSchema.pre('save', function () {
  if (this.isModified('code')) {
    this.code = this.code.toUpperCase();
  }
});

// ── Model export (handle hot-reload in Next.js dev) ───────────────────
const Coupon: Model<ICoupon> =
  mongoose.models.Coupon || mongoose.model<ICoupon>('Coupon', CouponSchema);

export default Coupon;
