import type { DiscountType } from '@/lib/types/coupon';

export interface PriceCouponInput {
  discountType: DiscountType;
  discountValue: number;
}

/** Final charge in ₪ after applying a validated coupon (percentage capped at 100). */
export function priceAfterCoupon(basePrice: number, coupon: PriceCouponInput | null): number {
  if (!coupon || basePrice <= 0) return basePrice;
  if (coupon.discountType === 'percentage') {
    const pct = Math.min(100, Math.max(0, coupon.discountValue));
    return Math.max(0, Math.round((basePrice * (100 - pct)) / 100));
  }
  return Math.max(0, basePrice - coupon.discountValue);
}
