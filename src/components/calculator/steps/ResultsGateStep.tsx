'use client';

import { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import DummyPaymentDialog from '@/components/calculator/DummyPaymentDialog';
import CouponPaymentSection from '@/components/calculator/CouponPaymentSection';
import { useCalculatorFeatures } from '../CalculatorFeaturesContext';
import type { StepProps } from '../CalculatorWizard';

export default function ResultsGateStep({ state, dispatch }: StepProps) {
  const { paymentEnabled, calculatorChargeAmount } = useCalculatorFeatures();
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

  const goToDetailedResults = () => dispatch({ type: 'NEXT_STEP' });

  const handlePrimaryClick = () => {
    if (showPaymentBlock) {
      setPaymentDialogOpen(true);
      return;
    }
    goToDetailedResults();
  };

  const handlePaymentConfirm = () => {
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
          {showPaymentBlock && (
            <CouponPaymentSection state={state} dispatch={dispatch} context="results_gate" />
          )}
          {paymentEnabled && (
            <Typography variant="body1" mb={2} textAlign="center">
              לצפייה בתוצאות המפורטות:{' '}
              <strong>{calculatorChargeAmount.toLocaleString('he-IL')} ₪</strong>
            </Typography>
          )}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
            <Button variant="outlined" onClick={() => dispatch({ type: 'RESET_CALCULATOR' })}>
              חזרה להתחלה
            </Button>
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
          {showPaymentBlock && (
            <CouponPaymentSection state={state} dispatch={dispatch} context="results_gate" />
          )}
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
            <Button variant="outlined" onClick={() => dispatch({ type: 'RESET_CALCULATOR' })}>
              חזרה להתחלה
            </Button>
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
      />
    </Box>
  );
}
