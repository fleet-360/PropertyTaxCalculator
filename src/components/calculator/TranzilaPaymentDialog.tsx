'use client';

/**
 * Real payment dialog: creates a server session, embeds Tranzila iframe when configured,
 * or falls back to demo mode (same UX as DummyPaymentDialog) for local dev without credentials.
 */

import { useCallback, useEffect, useRef, useState, type Dispatch } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import CloseIcon from '@mui/icons-material/Close';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import type { WizardAction, WizardState } from '@/components/calculator/CalculatorWizard';
import type { CouponPaymentSectionContext } from '@/components/calculator/CouponPaymentSection';
import type { PaymentProduct } from '@/lib/payments';

type PaymentMode = 'tranzila' | 'demo' | 'free';

interface CreatePaymentResponse {
  orderId: string;
  amountNis: number;
  mode: PaymentMode;
  status: 'pending' | 'paid';
  paymentUrl?: string;
  error?: string;
}

export interface TranzilaPaymentDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  amountNis: number;
  product: PaymentProduct;
  title?: string;
  state: WizardState;
  dispatch: Dispatch<WizardAction>;
  context: CouponPaymentSectionContext;
}

export default function TranzilaPaymentDialog({
  open,
  onClose,
  onConfirm,
  amountNis: displayAmountNis,
  product,
  state,
}: TranzilaPaymentDialogProps) {
  const titleId = 'tranzila-payment-dialog-title';
  const descId = 'tranzila-payment-dialog-desc';

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<CreatePaymentResponse | null>(null);
  const [completingDemo, setCompletingDemo] = useState(false);
  const confirmedRef = useRef(false);

  console.log("state", state);
  const leadId = state.leadId;
  const couponCode = state.appliedCoupon?.code;

  const finishPaid = useCallback(() => {
    if (confirmedRef.current) return;
    confirmedRef.current = true;
    onConfirm();
    onClose();
  }, [onConfirm, onClose]);

  const startSession = useCallback(async () => {
    if (!leadId) {
      setError('חסרים פרטי ליד. השלימו את שלב הזנת הנתונים ונסו שוב.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    setSession(null);
    confirmedRef.current = false;

    try {
      const res = await fetch('/api/payments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId, product, couponCode }),
      });
      const data = (await res.json()) as CreatePaymentResponse & { error?: string };
      if (!res.ok) {
        setError(data.error ?? 'לא ניתן לפתוח תשלום');
        return;
      }
      setSession(data);
      if (data.status === 'paid' || data.mode === 'free') {
        finishPaid();
      }
    } catch {
      setError('שגיאת רשת. נסו שוב.');
    } finally {
      setLoading(false);
    }
  }, [leadId, product, couponCode, finishPaid]);

  useEffect(() => {
    if (!open) {
      setSession(null);
      setError(null);
      confirmedRef.current = false;
      return;
    }
    void startSession();
  }, [open, startSession]);

  // Poll Tranzila notify completion while iframe is open.
  useEffect(() => {
    if (!open || !session?.orderId || session.mode !== 'tranzila') return;
    const orderId = session.orderId;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/payments/${orderId}`);
        if (!res.ok) return;
        const data = (await res.json()) as { status: string };
        if (data.status === 'paid') {
          clearInterval(interval);
          finishPaid();
        }
      } catch {
        /* ignore transient poll errors */
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [open, session, finishPaid]);

  const handleDemoPay = async () => {
    if (!session?.orderId) return;
    setCompletingDemo(true);
    setError(null);
    try {
      const res = await fetch(`/api/payments/${session.orderId}`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'תשלום הדגמה נכשל');
        return;
      }
      finishPaid();
    } catch {
      setError('שגיאת רשת. נסו שוב.');
    } finally {
      setCompletingDemo(false);
    }
  };

  const chargeAmount = session?.amountNis ?? displayAmountNis;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby={titleId}
      aria-describedby={descId}
      fullWidth
      maxWidth="xs"
      slotProps={{
        paper: {
          sx: (theme) => ({
            borderRadius: 2,
            border: `1px solid ${theme.palette.divider}`,
            bgcolor: theme.palette.background.paper,
            display: 'flex',
            flexDirection: 'column',
            maxHeight: 'calc(100% - 64px)',
            overflow: 'hidden',
          }),
        },
      }}
    >
      <Box
        sx={{
          position: 'relative',
          flex: '1 1 auto',
          minHeight: 0,
          overflowY: 'auto',
        }}
      >
        <Typography
          id={titleId}
          component="h2"
          sx={{
            position: 'absolute',
            width: 1,
            height: 1,
            overflow: 'hidden',
            clip: 'rect(0 0 0 0)',
          }}
        >
          תשלום מאובטח
        </Typography>

        <IconButton
          onClick={onClose}
          aria-label="סגירת חלון תשלום"
          size="small"
          sx={(theme) => ({
            position: 'sticky',
            top: 8,
            insetInlineEnd: 8,
            float: 'inline-end',
            zIndex: 2,
            bgcolor: theme.palette.background.paper,
            border: `1px solid ${theme.palette.divider}`,
            '&:hover': { bgcolor: theme.palette.action.hover },
          })}
        >
          <CloseIcon fontSize="small" />
        </IconButton>

        {loading && (
          <Box py={8} textAlign="center">
            <CircularProgress aria-label="טוען מסך תשלום" />
          </Box>
        )}

        {error && (
          <Box p={2}>
            <Alert severity="error">{error}</Alert>
          </Box>
        )}

        {!loading && session?.mode === 'tranzila' && session.paymentUrl && (
          <Box
            component="iframe"
            title="תשלום מאובטח בטרנזילה"
            src={session.paymentUrl}
            sx={{ display: 'block', width: '100%', height: 480, border: 0 }}
          />
        )}

        {!loading && session?.mode === 'demo' && (
          <Box
            component="img"
            src="/images/calculator/tranzila.png"
            alt="מסך תשלום — מצב הדגמה (ללא חיוב אמיתי)"
            sx={{
              display: 'block',
              width: '100%',
              height: 'auto',
              userSelect: 'none',
              pointerEvents: 'none',
            }}
          />
        )}
      </Box>

      <DialogContent
        sx={(theme) => ({
          pt: 2,
          pb: 2,
          flex: '0 0 auto',
          borderTop: `1px solid ${theme.palette.divider}`,
          bgcolor: theme.palette.background.paper,
        })}
      >
        <DialogContentText
          id={descId}
          component="div"
          sx={{
            position: 'absolute',
            width: 1,
            height: 1,
            overflow: 'hidden',
            clip: 'rect(0 0 0 0)',
          }}
        >
          {session?.mode === 'demo'
            ? `מסך תשלום הדגמה. סכום ${chargeAmount} שקלים.`
            : `תשלום מאובטח בטרנזילה. סכום ${chargeAmount} שקלים.`}
        </DialogContentText>

        {session?.mode === 'demo' && (
          <Stack spacing={1.5} alignItems="center">
            <Button
              onClick={() => void handleDemoPay()}
              variant="contained"
              color="primary"
              fullWidth
              disabled={completingDemo}
              sx={{ py: 1.25, fontWeight: 700, fontSize: '1rem' }}
            >
              {completingDemo ? (
                <CircularProgress size={22} color="inherit" />
              ) : (
                `שלם והמשך — ${chargeAmount.toLocaleString('he-IL')} ₪`
              )}
            </Button>
            <Stack direction="row" alignItems="center" spacing={0.5} sx={{ color: 'text.secondary' }}>
              <LockOutlinedIcon sx={{ fontSize: 14 }} aria-hidden />
              <Typography variant="caption">
                מצב הדגמה — לא מתבצע חיוב אמיתי (הגדירו TRANZILA_TERMINAL לחיוב אמיתי)
              </Typography>
            </Stack>
          </Stack>
        )}

        {session?.mode === 'tranzila' && (
          <Stack direction="row" alignItems="center" justifyContent="center" spacing={0.5} sx={{ color: 'text.secondary' }}>
            <LockOutlinedIcon sx={{ fontSize: 14 }} aria-hidden />
            <Typography variant="caption">תשלום מאובטח באמצעות טרנזילה</Typography>
          </Stack>
        )}
      </DialogContent>
    </Dialog>
  );
}
