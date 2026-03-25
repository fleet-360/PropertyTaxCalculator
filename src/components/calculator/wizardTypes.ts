import type { DiscountType } from '@/lib/types/coupon';

/** Coupon applied in the wizard (persists for calculator + appeal payment). */
export interface AppliedWizardCoupon {
  code: string;
  discountType: DiscountType;
  discountValue: number;
}
