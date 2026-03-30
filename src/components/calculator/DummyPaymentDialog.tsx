'use client';

import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import CouponPaymentSection, { CouponPaymentSectionContext } from './CouponPaymentSection';
import { WizardAction, WizardState } from './CalculatorWizard';
import { Dispatch } from 'react';

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

const DEFAULT_TITLE = 'תשלום (הדגמה)';

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
  const titleId = 'dummy-payment-dialog-title';
  const descId = 'dummy-payment-dialog-desc';

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
    >
      <DialogTitle id={titleId}>{title}</DialogTitle>
      <DialogContent>
        <DialogContentText id={descId} component="div">
          זהו מסך תשלום לדוגמה בלבד — לא מתבצע חיוב אמיתי.
          <br />
          <strong>
            סכום להצגה: {amountNis.toLocaleString('he-IL')} ₪
          </strong>
        </DialogContentText>
        <CouponPaymentSection state={state} dispatch={dispatch} context={context} />

      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} color="inherit">
          ביטול
        </Button>
        <Button onClick={handleConfirm} variant="contained" color="primary">
          אישור והמשך
        </Button>
      </DialogActions>
    </Dialog>
  );
}
