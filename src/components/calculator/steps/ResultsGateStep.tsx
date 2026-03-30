'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import DummyPaymentDialog from '@/components/calculator/DummyPaymentDialog';
import CouponPaymentSection from '@/components/calculator/CouponPaymentSection';
import coffeePastryImage from '@/assets/results-gate-coffee-pastry.png';
import { useCalculatorFeatures } from '../CalculatorFeaturesContext';
import { useEmailSend } from '@/hooks/useEmailSend';
import type { StepProps } from '../CalculatorWizard';

function PaymentUpsellBanner() {
  return (
    <Stack spacing={2} sx={{ mt: 4, mb: 2 }}>
      <Box
        sx={(theme) => ({
          border: `1px solid ${theme.palette.divider}`,
          bgcolor: 'background.paper',
          borderRadius: 1,
          px: 2,
          py: 2,
          textAlign: 'center',
        })}
      >
        <Typography variant="body1" component="p" sx={{ m: 0 }}>
          זה לוקח כמה שניות
        </Typography>
        <Typography variant="body1" component="p" sx={{ m: 0, mt: 1 }}>
          והמחיר של כוס קפה ומאפה
        </Typography>
      </Box>
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          borderRadius: 2,
          overflow: 'hidden',
        }}
      >
        <Image
          src={coffeePastryImage}
          alt="כוס קפה ומאפה על שולחן במסעדה"
          width={coffeePastryImage.width}
          height={coffeePastryImage.height}
          sizes="(max-width: 600px) 100vw, 600px"
          style={{ width: '100%', height: 'auto' }}
        />
      </Box>
    </Stack>
  );
}

export default function ResultsGateStep({ state, dispatch }: StepProps) {
  const { paymentEnabled, calculatorChargeAmount } = useCalculatorFeatures();
  const { sendEmail } = useEmailSend();
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const result = state.calculationResult;

  if (state.isLoading || !result) {
    return (
      <Box textAlign="center" py={6}>
        <CircularProgress />
        <Typography mt={2}>מחשב תוצאות...</Typography>
      </Box>
    );
  }

  const outcome: string = result.outcome ?? 'match';
  const showPaymentBlock = paymentEnabled && (outcome === 'underpaying' || outcome === 'overpaying');

  // ── Mia message based on outcome ──
  useEffect(() => {
    const miaId =
      outcome === 'overpaying'
        ? 'step-5-overpaying'
        : outcome === 'underpaying'
          ? 'step-5-underpaying'
          : 'step-5-match';
    dispatch({ type: 'SET_MIA_MESSAGE', payload: miaId });
  }, [outcome, dispatch]);

  const goToDetailedResults = () => dispatch({ type: 'NEXT_STEP' });

  const handlePrimaryClick = () => {
    if (showPaymentBlock) {
      setPaymentDialogOpen(true);
      return;
    }
    goToDetailedResults();
  };

  const sendInvoice = () => {
    if (!state.email) return;
    sendEmail({
      type: 'invoice',
      to: state.email,
      payload: {
        fullName: state.fullName,
        itemDescription: 'צפייה בתוצאות מפורטות — מחשבון הארנונה',
        amountNis: calculatorChargeAmount,
        date: new Date().toISOString(),
      },
    }).catch(() => {
      // Invoice sending is non-blocking
    });
  };

  const handlePaymentConfirm = () => {
    sendInvoice();
    goToDetailedResults();
  };

  return (
    <Box>
      <Typography variant="h5" textAlign="center" mb={4}>
        תוצאות
      </Typography>

      {outcome === 'match' && (
        <>
          <Alert severity="success" sx={{ mb: 3, fontSize: '1rem' }}>
            {'\u{1F60A}'} על פי המידע שהזנת, נראה שהחישוב תואם את הנתונים שגובה העירייה
          </Alert>
          <Typography textAlign="center" color="text.secondary" mb={3}>
            תודה שהשתמשת במחשבון הארנונה
          </Typography>
          <Box textAlign="center">
            <Button variant="contained" onClick={() => dispatch({ type: 'RESET_CALCULATOR' })}>
              חזרה להתחלה
            </Button>
          </Box>
        </>
      )}

      {outcome === 'underpaying' && (
        <>
          <Alert severity="info" sx={{ mb: 3, fontSize: '1rem' }}>
            {`לפי המחשבון, נמצא אי-התאמה בין תוצאת המחשבון לדו"ח הארנונה`}
          </Alert>
          <Typography variant="body1" mb={2} textAlign="center">
            אין התאמה — תרצה לראות את התוצאות?
          </Typography>
          {paymentEnabled && (
            <Typography variant="body1" mb={2} textAlign="center">
              לצפייה בתוצאות המפורטות:{' '}
              <strong>{calculatorChargeAmount.toLocaleString('he-IL')} ₪</strong>
            </Typography>
          )}
          {paymentEnabled && <PaymentUpsellBanner />}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: paymentEnabled ? 2 : 4 }}>
            {/* <Button variant="outlined" onClick={() => dispatch({ type: 'RESET_CALCULATOR' })}>
              חזרה להתחלה
            </Button> */}
            <Button variant="contained" onClick={handlePrimaryClick}>
              {paymentEnabled ? 'תשלום וצפייה בתוצאות' : 'צפה בתוצאות מפורטות'}
            </Button>
          </Box>
        </>
      )}

      {outcome === 'overpaying' && (
        <>
          <Alert severity="success" sx={{ mb: 3, fontSize: '1rem' }}>
            {'\u{1F389}'} על פי המחשבון אתה זכאי להנחה!
          </Alert>
          {paymentEnabled ? (
            <Typography variant="body1" mb={2} textAlign="center">
              לצפייה בתוצאות המפורטות:{' '}
              <strong>{calculatorChargeAmount.toLocaleString('he-IL')} ₪</strong>
            </Typography>
          ) : (
            <Typography variant="body1" mb={2} textAlign="center">
              תרצה לראות את התוצאות המפורטות?
            </Typography>
          )}
          {paymentEnabled && <PaymentUpsellBanner />}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: paymentEnabled ? 2 : 4 }}>
            {/* <Button variant="outlined" onClick={() => dispatch({ type: 'RESET_CALCULATOR' })}>
              חזרה להתחלה
            </Button> */}
            <Button variant="contained" size="large" onClick={handlePrimaryClick}>
              {paymentEnabled ? 'תשלום וצפייה בתוצאות' : 'צפה בתוצאות מפורטות'}
            </Button>
          </Box>
        </>
      )}

      <DummyPaymentDialog
        open={paymentDialogOpen}
        onClose={() => setPaymentDialogOpen(false)}
        onConfirm={handlePaymentConfirm}
        amountNis={calculatorChargeAmount}
        state={state}
        dispatch={dispatch}
        context="results_gate"
      />
    </Box>
  );
}
