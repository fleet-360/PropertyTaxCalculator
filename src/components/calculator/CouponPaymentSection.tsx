'use client';

import { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import Paper from '@mui/material/Paper';
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

interface CouponPaymentSectionProps {
  state: WizardState;
  dispatch: Dispatch<WizardAction>;
  context: CouponPaymentSectionContext;
}

export default function CouponPaymentSection({ state, dispatch, context }: CouponPaymentSectionProps) {
  const { calculatorPrice, appealPrice } = useCalculatorFeatures();
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hint =
    context === 'results_gate'
      ? `ניתן להזין קופון לפני התשלום. הקופון יחול על תשלום צפייה בתוצאות המפורטות (${calculatorPrice.toLocaleString('he-IL')} ₪) ועל תשלום הכנת ההשגה (${appealPrice.toLocaleString('he-IL')} ₪).`
      : 'אותו קופון מהשלב הקודם חל על תשלום ההשגה; ניתן לעדכן או להסיר לפני התשלום.';

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

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="subtitle1" fontWeight={600} textAlign="center" mb={1}>
        קוד קופון
      </Typography>
      <Typography variant="body2" color="text.secondary" textAlign="center" mb={2}>
        {hint}
      </Typography>
      <Box sx={{ p: 2, display: 'flex', gap: 1, alignItems: 'center' }}>
        <TextField
          label="קוד קופון"
          value={state.couponCodeDraft}
          onChange={(e) =>
            dispatch({ type: 'UPDATE_FIELD', field: 'couponCodeDraft', value: e.target.value })
          }
          size="small"
          disabled={validating}
          inputProps={{ 'aria-label': 'קוד קופון' }}
        />
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button variant="contained" onClick={applyCoupon} disabled={validating}>
            {validating ? 'בודק…' : 'החל קופון'}
          </Button>
          {state.appliedCoupon && (
            <Button variant="outlined" color="inherit" onClick={clearCoupon} disabled={validating}>
              הסר קופון
            </Button>
          )}
        </Box>
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
        {state.appliedCoupon && !error && (
          <Alert severity="success" sx={{ mt: 2 }}>
            קופון <strong>{state.appliedCoupon.code}</strong> הוחל — הנחה {formatDiscount(state.appliedCoupon)}
          </Alert>
        )}
      </Box>
    </Box>
  );
}
