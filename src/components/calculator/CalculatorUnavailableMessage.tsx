'use client';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

export type CalculatorUnavailableVariant = 'standalone' | 'embedded';

interface CalculatorUnavailableMessageProps {
  /** `embedded` — inside landing CTA card; `standalone` — full /calculator page */
  variant?: CalculatorUnavailableVariant;
}

const ALERT_TEXT =
  'המערכת במצב תחזוקה — המחשבון אינו זמין למשתמשים. נסו שוב מאוחר יותר.';

/** Shown when SystemConfig.systemEnabled is false (aligns with admin system-config copy). */
export default function CalculatorUnavailableMessage({
  variant = 'standalone',
}: CalculatorUnavailableMessageProps) {
  if (variant === 'embedded') {
    return (
      <Box sx={{ py: 2, textAlign: 'center' }}>
        <Typography variant="subtitle1" component="p" gutterBottom>
          המחשבון אינו זמין
        </Typography>
        <Alert severity="warning" sx={{ mt: 1}}>
          {ALERT_TEXT}
        </Alert>
      </Box>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Box sx={{ textAlign: 'center' }}>
        <Typography variant="h5" component="h1" gutterBottom>
          המחשבון אינו זמין
        </Typography>
        <Alert severity="warning" sx={{ mt: 2 }}>
          {ALERT_TEXT}
        </Alert>
      </Box>
    </Container>
  );
}
