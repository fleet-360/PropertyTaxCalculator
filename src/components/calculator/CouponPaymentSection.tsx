'use client';

import { useState } from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import type { Dispatch } from 'react';
import { useCalculatorFeatures } from '@/components/calculator/CalculatorFeaturesContext';
import type { WizardAction, WizardState } from './CalculatorWizard';
import type { AppliedWizardCoupon } from './wizardTypes';

function mapValidateReason(reason: string): string {
  const map: Record<string, string> = {
    'Coupon code is required': 'נא להזין קוד קופון',
    'Coupon not found': 'הקופון לא נמצא',
    'Coupon is no longer active': 'הקופון אינו פעיל',
    'Coupon has expired': 'תוקף הקופון פג',
    'Coupon has already been used': 'הקופון כבר נוצל',
  };
  return map[reason] ?? reason;
}

function formatDiscount(c: AppliedWizardCoupon): string {
  return c.discountType === 'percentage'
    ? `${c.discountValue}%`
    : `${c.discountValue.toLocaleString('he-IL')} ₪`;
}

export type CouponPaymentSectionContext = 'results_gate' | 'appeal';

export type CouponPaymentSectionDensity = 'default' | 'checkout';

interface CouponPaymentSectionProps {
  state: WizardState;
  dispatch: Dispatch<WizardAction>;
  context: CouponPaymentSectionContext;
  /** `checkout`: tighter layout for payment modal */
  density?: CouponPaymentSectionDensity;
}

export default function CouponPaymentSection({
  state,
  dispatch,
  context,
  density = 'default',
}: CouponPaymentSectionProps) {
  const { calculatorPrice, appealPrice } = useCalculatorFeatures();
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hintLong =
    context === 'results_gate'
      ? `ניתן להזין קופון לפני התשלום. הקופון יחול על תשלום צפייה בתוצאות המפורטות (${calculatorPrice.toLocaleString('he-IL')} ₪) ועל תשלום הכנת ההשגה (${appealPrice.toLocaleString('he-IL')} ₪).`
      : 'אותו קופון מהשלב הקודם חל על תשלום ההשגה; ניתן לעדכן או להסיר לפני התשלום.';

  const hintCheckout =
    context === 'results_gate'
      ? `הקופון חל על צפייה בתוצאות (${calculatorPrice.toLocaleString('he-IL')} ₪) ועל הכנת השגה (${appealPrice.toLocaleString('he-IL')} ₪).`
      : 'ניתן לעדכן או להסיר את הקופון לפני התשלום.';

  const hint = density === 'checkout' ? hintCheckout : hintLong;

  const applyCoupon = async () => {
    const raw = state.couponCodeDraft.trim();
    setError(null);
    if (!raw) {
      setError('נא להזין קוד קופון');
      return;
    }
    setValidating(true);
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: raw }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.reason ? mapValidateReason(data.reason) : 'שגיאה באימות הקופון');
        return;
      }
      if (!data.valid) {
        setError(data.reason ? mapValidateReason(data.reason) : 'הקופון אינו תקף');
        return;
      }
      const applied: AppliedWizardCoupon = {
        code: raw.toUpperCase(),
        discountType: data.discountType,
        discountValue: Number(data.discountValue),
      };
      dispatch({
        type: 'UPDATE_FIELDS_BULK',
        payload: { appliedCoupon: applied },
      });
    } catch {
      setError('שגיאת רשת — נסו שוב');
    } finally {
      setValidating(false);
    }
  };

  const clearCoupon = () => {
    setError(null);
    dispatch({
      type: 'UPDATE_FIELDS_BULK',
      payload: { appliedCoupon: null, couponCodeDraft: '' },
    });
  };

  const outerSx = density === 'checkout' ? { mb: 0 } : { mb: 3 };
  const titleAlign = density === 'checkout' ? 'start' : 'center';
  const hintAlign = density === 'checkout' ? 'start' : 'center';
  const titleMb = density === 'checkout' ? 0.5 : 1;
  const hintMb = density === 'checkout' ? 1.5 : 2;

  if (state.appliedCoupon) {
    return (
      <Box sx={outerSx}>
        <Typography variant="subtitle1" fontWeight={600} textAlign={titleAlign} mb={titleMb}>
          קוד קופון
        </Typography>
        <Alert
          severity="success"
          sx={{ alignItems: 'center' }}
          action={
            <Button color="inherit" size="small" onClick={clearCoupon} disabled={validating}>
              הסר קופון
            </Button>
          }
        >
          קופון <strong>{state.appliedCoupon.code}</strong> הוחל — הנחה {formatDiscount(state.appliedCoupon)}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={outerSx}>
      <Typography variant="subtitle1" fontWeight={600} textAlign={titleAlign} mb={titleMb}>
        קוד קופון
      </Typography>
      <Typography variant="body2" color="text.secondary" textAlign={hintAlign} mb={hintMb}>
        {hint}
      </Typography>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1}
        alignItems={{ xs: 'stretch', sm: 'flex-start' }}
        sx={{ p: density === 'checkout' ? 0 : 2 }}
      >
        <TextField
          label="קוד קופון"
          value={state.couponCodeDraft}
          onChange={(e) =>
            dispatch({ type: 'UPDATE_FIELD', field: 'couponCodeDraft', value: e.target.value })
          }
          size="small"
          disabled={validating}
          fullWidth
          sx={{ flex: { sm: 1 } }}
          inputProps={{ 'aria-label': 'קוד קופון' }}
        />
        <Button
          variant="contained"
          onClick={applyCoupon}
          disabled={validating}
          sx={{ flexShrink: 0, alignSelf: { xs: 'stretch', sm: 'auto' } }}
        >
          {validating ? 'בודק…' : 'החל קופון'}
        </Button>
      </Stack>
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
    </Box>
  );
}
