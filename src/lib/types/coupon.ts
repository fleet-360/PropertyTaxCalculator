/**
 * Shared plain-data interfaces for the Coupon domain.
 *
 * These are the single source of truth for coupon structures.
 * The Mongoose model (`src/lib/models/Coupon.ts`) and all consumers
 * import from here.
 */

// ── Discount type ───────────────────────────────────────────────────
export type DiscountType = 'percentage' | 'fixed';

// ── Coupon data (plain, no Mongoose Document) ───────────────────────
export interface ICouponData {
  _id?: string;
  code: string;
  discountType: DiscountType;
  discountValue: number;
  isOneTimeUse: boolean;
  usedBy?: string;
  usedAt?: string;
  isActive: boolean;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ── Coupon form data (for create/edit forms) ────────────────────────
export interface CouponFormData {
  code: string;
  discountType: DiscountType;
  discountValue: string;
  isOneTimeUse: boolean;
  expiresAt: string;
}
