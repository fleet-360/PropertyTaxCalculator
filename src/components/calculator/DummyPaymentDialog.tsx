'use client';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import CloseIcon from '@mui/icons-material/Close';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import CouponPaymentSection, { CouponPaymentSectionContext } from './CouponPaymentSection';
import { useCalculatorFeatures } from '@/components/calculator/CalculatorFeaturesContext';
import { WizardAction, WizardState } from './CalculatorWizard';
import { Dispatch } from 'react';
import type { AppliedWizardCoupon } from './wizardTypes';

export interface DummyPaymentDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  /** Amount in ₪ (display only — demo flow) */
  amountNis: number;
  title?: string;
  state: WizardState;
  dispatch: Dispatch<WizardAction>;
  context: CouponPaymentSectionContext;
}

const DEFAULT_TITLE = 'תשלום מאובטח';

function serviceLabel(ctx: CouponPaymentSectionContext): string {
  return ctx === 'results_gate' ? 'צפייה בתוצאות המחשבון המפורטות' : 'הכנת מסמך השגה';
}

function formatDiscountLine(c: AppliedWizardCoupon): string {
  return c.discountType === 'percentage'
    ? `${c.discountValue}%`
    : `${c.discountValue.toLocaleString('he-IL')} ₪`;
}

export default function DummyPaymentDialog({
  open,
  onClose,
  onConfirm,
  amountNis,
  title = DEFAULT_TITLE,
  state,
  dispatch,
  context,
}: DummyPaymentDialogProps) {
  const { calculatorPrice, appealPrice } = useCalculatorFeatures();
  const titleId = 'dummy-payment-dialog-title';
  const descId = 'dummy-payment-dialog-desc';

  const baseAmountNis = context === 'results_gate' ? calculatorPrice : appealPrice;
  const applied = state.appliedCoupon;
  const discountNis =
    applied && baseAmountNis > 0 ? Math.max(0, baseAmountNis - amountNis) : 0;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby={titleId}
      aria-describedby={descId}
      fullWidth
      maxWidth="sm"
      slotProps={{
        paper: {
          sx: (theme) => ({
            borderRadius: 2,
            border: `1px solid ${theme.palette.divider}`,
          }),
        },
      }}
    >
      <DialogTitle
        component="div"
        id={titleId}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1,
          pr: 1,
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1} sx={{ minWidth: 0 }}>
          <LockOutlinedIcon color="primary" sx={{ flexShrink: 0 }} aria-hidden />
          <Typography component="span" variant="h6" sx={{ fontWeight: 700 }}>
            {title}
          </Typography>
        </Stack>
        <IconButton
          onClick={onClose}
          aria-label="סגירת חלון תשלום"
          edge="end"
          size="small"
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 0 }}>
        <DialogContentText id={descId} component="div" sx={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>
          מסך תשלום להדגמה. סכום לתשלום {amountNis.toLocaleString('he-IL')} שקלים חדשים.
        </DialogContentText>

        <Paper
          variant="outlined"
          sx={(theme) => ({
            p: 2,
            mb: 2,
            borderRadius: 2,
            bgcolor: theme.palette.background.paper,
          })}
        >
          <Typography variant="overline" color="text.secondary" display="block" sx={{ mb: 1.5 }}>
            סיכום תשלום
          </Typography>
          <Stack spacing={1}>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={2}>
              <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
                {serviceLabel(context)}
              </Typography>
            </Stack>

            {applied ? (
              <>
                <Stack direction="row" justifyContent="space-between" alignItems="center" gap={2}>
                  <Typography variant="body2" color="text.secondary">
                    מחיר לפני הנחה
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ textDecoration: 'line-through' }}
                  >
                    {baseAmountNis.toLocaleString('he-IL')} ₪
                  </Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between" alignItems="center" gap={2}>
                  <Typography variant="body2" color="success.main">
                    הנחה (קופון {applied.code}) — {formatDiscountLine(applied)}
                  </Typography>
                  <Typography variant="body2" color="success.main" fontWeight={600}>
                    −{discountNis.toLocaleString('he-IL')} ₪
                  </Typography>
                </Stack>
                <Divider flexItem />
              </>
            ) : null}

            <Stack direction="row" justifyContent="space-between" alignItems="baseline" gap={2}>
              <Typography variant="subtitle1" fontWeight={700}>
                סה״כ לתשלום
              </Typography>
              <Typography variant="h6" component="span" fontWeight={800} sx={{ color: 'primary.main' }}>
                {amountNis.toLocaleString('he-IL')} ₪
              </Typography>
            </Stack>
          </Stack>
        </Paper>

        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2, color: 'text.secondary' }}>
          <LockOutlinedIcon sx={{ fontSize: 18 }} aria-hidden />
          <Typography variant="caption">חיבור מאובטח — הפרטים מוצגים לצורך ביצוע התשלום בלבד</Typography>
        </Stack>

        <CouponPaymentSection
          state={state}
          dispatch={dispatch}
          context={context}
          density="checkout"
        />

        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 2 }}>
          זהו מסך תשלום לדוגמה בלבד — לא מתבצע חיוב אמיתי.
        </Typography>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2, pt: 0, gap: 1 }}>
        <Button onClick={onClose} color="inherit">
          ביטול
        </Button>
        <Button onClick={handleConfirm} variant="contained" color="primary">
          שלם והמשך
        </Button>
      </DialogActions>
    </Dialog>
  );
}
