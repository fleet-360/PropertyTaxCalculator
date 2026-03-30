'use client';

import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import DummyPaymentDialog from '@/components/calculator/DummyPaymentDialog';
import CouponPaymentSection from '@/components/calculator/CouponPaymentSection';
import { useCalculatorFeatures } from '../CalculatorFeaturesContext';
import { useEmailSend } from '@/hooks/useEmailSend';
import type { StepProps } from '../CalculatorWizard';

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
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
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
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
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
