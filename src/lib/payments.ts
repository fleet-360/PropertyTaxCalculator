import { randomUUID } from 'crypto';
import mongoose from 'mongoose';
import Coupon from '@/lib/models/Coupon';
import Lead from '@/lib/models/Lead';
import PaymentOrder, { type IPaymentOrder } from '@/lib/models/PaymentOrder';
import SystemConfig from '@/lib/models/SystemConfig';
import { priceAfterCoupon } from '@/lib/priceAfterCoupon';
import { toCalculatorFeatureConfig } from '@/lib/types/system-config';
import { buildTranzilaIframeUrl, isTranzilaConfigured } from '@/lib/tranzila';

// ── Types ────────────────────────────────────────────────────────────

/** Product paid through the calculator wizard. */
export type PaymentProduct = 'calculator' | 'appeal';

export type PaymentOrderStatus = 'pending' | 'paid' | 'failed';

export interface PaymentCouponInput {
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
}

export interface ResolvedCharge {
  amountNis: number;
  basePrice: number;
  coupon: PaymentCouponInput | null;
}

type CouponValidationResult =
  | { ok: true; coupon: PaymentCouponInput | null }
  | { ok: false; reason: string };

// ── Coupon validation ────────────────────────────────────────────────

/** Server-side coupon validation (same rules as /api/coupons/validate). */
export async function validateCouponForPayment(
  code: string | undefined,
): Promise<CouponValidationResult> {
  if (!code?.trim()) {
    return { ok: true, coupon: null };
  }

  const normalized = code.toUpperCase().trim();
  const coupon = await Coupon.findOne({ code: normalized }).lean();
  if (!coupon) {
    return { ok: false, reason: 'Coupon not found' };
  }
  if (!coupon.isActive) {
    return { ok: false, reason: 'Coupon is no longer active' };
  }
  if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
    return { ok: false, reason: 'Coupon has expired' };
  }
  if (coupon.isOneTimeUse && coupon.usedAt) {
    return { ok: false, reason: 'Coupon has already been used' };
  }

  return {
    ok: true,
    coupon: {
      code: normalized,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
    },
  };
}

// ── Pricing ──────────────────────────────────────────────────────────

/** Base price + validated coupon → final ₪ charge (server source of truth). */
export async function resolveChargeAmount(
  product: PaymentProduct,
  couponCode?: string,
): Promise<{ ok: true; charge: ResolvedCharge } | { ok: false; reason: string }> {
  const config = await SystemConfig.getConfig();
  const features = toCalculatorFeatureConfig({
    paymentEnabled: config.paymentEnabled,
    systemEnabled: config.systemEnabled,
    calculatorPrice: config.calculatorPrice,
    appealPrice: config.appealPrice,
  });
  const basePrice =
    product === 'calculator' ? features.calculatorPrice : features.appealPrice;

  const couponResult = await validateCouponForPayment(couponCode);
  if (!couponResult.ok) {
    return { ok: false, reason: couponResult.reason };
  }

  const amountNis = priceAfterCoupon(basePrice, couponResult.coupon);
  return {
    ok: true,
    charge: {
      amountNis,
      basePrice,
      coupon: couponResult.coupon,
    },
  };
}

// ── Fulfillment ──────────────────────────────────────────────────────

function paymentStatusForProduct(
  product: PaymentProduct,
): 'calculator_paid' | 'appeal_paid' {
  return product === 'calculator' ? 'calculator_paid' : 'appeal_paid';
}

/** Mark order paid and update lead + optional one-time coupon. Idempotent. */
export async function fulfillPaymentOrder(
  order: IPaymentOrder,
  tranzilaTransactionId?: string,
): Promise<void> {
  if (order.status === 'paid') return;

  order.status = 'paid';
  if (tranzilaTransactionId) {
    order.tranzilaTransactionId = tranzilaTransactionId;
  }
  await order.save();

  const lead = await Lead.findById(order.leadId);
  if (!lead) return;

  const calc = lead.calculations?.[order.calculationIndex];
  if (!calc) return;

  const newStatus = paymentStatusForProduct(order.product);
  const current = (calc.paymentStatus ?? 'none') as 'none' | 'calculator_paid' | 'appeal_paid';
  const rank: Record<'none' | 'calculator_paid' | 'appeal_paid', number> = {
    none: 0,
    calculator_paid: 1,
    appeal_paid: 2,
  };
  if (rank[newStatus] > rank[current]) {
    calc.paymentStatus = newStatus;
  }

  if (!calc.paymentTransactions) {
    calc.paymentTransactions = [];
  }
  calc.paymentTransactions.push({
    amount: order.amountNis,
    type: order.product,
    transactionId: tranzilaTransactionId ?? order.orderId,
    date: new Date(),
  });
  await lead.save();

  if (order.couponCode) {
    const coupon = await Coupon.findOne({ code: order.couponCode });
    if (coupon?.isOneTimeUse && !coupon.usedAt) {
      coupon.usedAt = new Date();
      coupon.usedBy = order.leadId as mongoose.Types.ObjectId;
      await coupon.save();
    }
  }
}

export async function findPaymentOrderByOrderId(
  orderId: string,
): Promise<IPaymentOrder | null> {
  return PaymentOrder.findOne({ orderId });
}

// ── Create session ───────────────────────────────────────────────────

export type CreatePaymentSessionInput = {
  leadId: string;
  calculationIndex: number;
  product: PaymentProduct;
  couponCode?: string;
};

export type CreatePaymentSessionResult =
  | {
      ok: true;
      orderId: string;
      amountNis: number;
      mode: 'tranzila' | 'demo' | 'free';
      paymentUrl?: string;
      status: 'pending' | 'paid';
    }
  | { ok: false; status: number; error: string };

const COUPON_ERROR_HE: Record<string, string> = {
  'Coupon not found': 'הקופון לא נמצא',
  'Coupon is no longer active': 'הקופון אינו פעיל',
  'Coupon has expired': 'תוקף הקופון פג',
  'Coupon has already been used': 'הקופון כבר נוצל',
};

export async function createPaymentSession(
  input: CreatePaymentSessionInput,
): Promise<CreatePaymentSessionResult> {
  const { leadId, calculationIndex, product, couponCode } = input;

  if (!mongoose.Types.ObjectId.isValid(leadId)) {
    return { ok: false, status: 400, error: 'מזהה ליד לא תקין' };
  }

  const lead = await Lead.findById(leadId);
  if (!lead) {
    return { ok: false, status: 404, error: 'לא נמצאו פרטי ליד' };
  }

  if (!Number.isInteger(calculationIndex) || calculationIndex < 0) {
    return { ok: false, status: 400, error: 'מזהה חישוב לא תקין' };
  }

  const calc = lead.calculations?.[calculationIndex];
  if (!calc) {
    return { ok: false, status: 404, error: 'חישוב לא נמצא עבור הליד' };
  }

  // Already-paid checks are per lead + calculationIndex (not global lead.paymentStatus)
  if (product === 'calculator' && calc.paymentStatus === 'calculator_paid') {
    return { ok: false, status: 409, error: 'התשלום עבור חישוב זה כבר בוצע' };
  }
  if (product === 'appeal' && calc.paymentStatus === 'appeal_paid') {
    return { ok: false, status: 409, error: 'התשלום עבור השגה בחישוב זה כבר בוצע' };
  }

  const chargeResult = await resolveChargeAmount(product, couponCode);
  if (!chargeResult.ok) {
    return {
      ok: false,
      status: 400,
      error: COUPON_ERROR_HE[chargeResult.reason] ?? chargeResult.reason,
    };
  }

  const { amountNis, coupon } = chargeResult.charge;
  const demoMode = !isTranzilaConfigured();

  // Enforce only one pending order per leadId+calculationIndex+product by reusing it.
  let order =
    (await PaymentOrder.findOne({
      leadId: lead._id,
      calculationIndex,
      product,
      status: 'pending',
    })) ?? null;

  if (order) {
    // Keep a single pending order but allow price/coupon updates before payment completes.
    order.amountNis = amountNis;
    order.couponCode = coupon?.code;
    order.payerEmail = lead.email;
    order.payerName = lead.fullName;
    order.demoMode = demoMode;
    await order.save();
  } else {
    const orderId = randomUUID();
    order = await PaymentOrder.create({
      orderId,
      leadId: lead._id,
      calculationIndex,
      product,
      amountNis,
      status: 'pending',
      couponCode: coupon?.code,
      payerEmail: lead.email,
      payerName: lead.fullName,
      demoMode,
    });
  }

  if (amountNis <= 0) {
    await fulfillPaymentOrder(order);
    return {
      ok: true,
      orderId: order.orderId,
      amountNis: 0,
      mode: 'free',
      status: 'paid',
    };
  }

  if (demoMode) {
    return {
      ok: true,
      orderId: order.orderId,
      amountNis,
      mode: 'demo',
      status: 'pending',
    };
  }

  try {
    const paymentUrl = await buildTranzilaIframeUrl({
      orderId: order.orderId,
      amountNis,
      payerName: lead.fullName,
      payerEmail: lead.email,
      payerPhone: lead.phone,
    });
    return {
      ok: true,
      orderId: order.orderId,
      amountNis,
      mode: 'tranzila',
      paymentUrl,
      status: 'pending',
    };
  } catch (err) {
    // Keep the pending order record for debugging/retry; just surface a gateway error.
    console.error('Tranzila iframe URL error:', err);
    return {
      ok: false,
      status: 502,
      error: 'לא ניתן לפתוח מסך תשלום. נסו שוב מאוחר יותר.',
    };
  }
}
