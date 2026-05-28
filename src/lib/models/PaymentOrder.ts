import mongoose, { Schema, Document, Model } from 'mongoose';
import type { PaymentOrderStatus, PaymentProduct } from '@/lib/payments';

export interface IPaymentOrder extends Document {
  orderId: string;
  leadId: mongoose.Types.ObjectId;
  /** Which calculation (index in lead.calculations[]) this payment is for */
  calculationIndex: number;
  product: PaymentProduct;
  amountNis: number;
  status: PaymentOrderStatus;
  couponCode?: string;
  tranzilaTransactionId?: string;
  payerEmail?: string;
  payerName?: string;
  /** True when Tranzila credentials are missing — demo completion allowed. */
  demoMode: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentOrderSchema = new Schema<IPaymentOrder>(
  {
    orderId: { type: String, required: true, unique: true, index: true },
    leadId: { type: Schema.Types.ObjectId, ref: 'Lead', required: true, index: true },
    calculationIndex: { type: Number, required: true, min: 0, index: true },
    product: { type: String, enum: ['calculator', 'appeal'], required: true },
    amountNis: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ['pending', 'paid', 'failed'],
      default: 'pending',
    },
    couponCode: { type: String, trim: true, uppercase: true },
    tranzilaTransactionId: { type: String },
    payerEmail: { type: String, trim: true },
    payerName: { type: String, trim: true },
    demoMode: { type: Boolean, default: false },
  },
  { timestamps: true },
);

const PaymentOrder: Model<IPaymentOrder> =
  (mongoose.models.PaymentOrder as Model<IPaymentOrder>) ||
  mongoose.model<IPaymentOrder>('PaymentOrder', PaymentOrderSchema);

export default PaymentOrder;
