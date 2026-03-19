'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import type { StepProps } from '../CalculatorWizard';

export default function ResultsGateStep({ state, dispatch }: StepProps) {
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

  return (
    <Box>
      <Typography variant="h5" textAlign="center" mb={4}>
        תוצאות
      </Typography>

      {outcome === 'match' && (
        <Alert severity="success" sx={{ mb: 3, fontSize: '1rem' }}>
          {'\u{1F60A}'} על פי המידע שהזנת, נראה שהחישוב תואם את הנתונים שגובה העירייה
        </Alert>
      )}

      {outcome === 'underpaying' && (
        <Alert severity="info" sx={{ mb: 3, fontSize: '1rem' }}>
          {`לפי המחשבון, נמצא אי-התאמה בין תוצאת המחשבון לדו"ח הארנונה`}
        </Alert>
      )}

      {outcome === 'overpaying' && (
        <>
          <Alert severity="success" sx={{ mb: 3, fontSize: '1rem' }}>
            {'\u{1F389}'} על פי המחשבון אתה זכאי להנחה!
          </Alert>
          <Typography variant="body1" mb={2} textAlign="center">
            לצפייה בתוצאות המפורטות: <strong>34₪</strong>
          </Typography>
          <Box textAlign="center">
            <Button
              variant="contained"
              size="large"
              onClick={() => dispatch({ type: 'NEXT_STEP' })}
            >
              תשלום וצפייה בתוצאות
            </Button>
          </Box>
        </>
      )}

      {outcome !== 'overpaying' && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
          <Button variant="outlined" onClick={() => dispatch({ type: 'PREV_STEP' })}>
            חזרה
          </Button>
          <Button variant="contained" onClick={() => dispatch({ type: 'NEXT_STEP' })}>
            צפה בתוצאות מפורטות
          </Button>
        </Box>
      )}
    </Box>
  );
}
