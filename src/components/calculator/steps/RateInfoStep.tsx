'use client';

import { useMemo } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Link from '@mui/material/Link';
import type { StepProps } from '../CalculatorWizard';
import { findRate } from '@/lib/calculator';

export default function RateInfoStep({ state, dispatch }: StepProps) {
  const result = useMemo(() => {
    if (!state.cityData) {
      return { error: 'לא נטענו נתוני עיר. יש לחזור ולבחור עיר.' };
    }

    if (!state.propertyPurpose || !state.subType || !state.zone) {
      return { error: 'חסרים שדות סיווג (ייעוד, סוג, אזור). יש לחזור ולמלא את הפרטים.' };
    }

    const totalArea =
      (state.propertyArea || 0) +
      (state.coveredBalconyArea || 0) +
      (state.storageArea || 0) +
      (state.parkingArea || 0);

    if (totalArea <= 0) {
      return { error: 'שטח הנכס חייב להיות גדול מ-0.' };
    }

    try {
      const { rate, propertyCode } = findRate(
        state.cityData,
        state.propertyPurpose,
        state.subType,
        state.zone,
        totalArea,
      );
      return { rate, propertyCode, totalArea };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'שגיאה בחישוב התעריף' };
    }
  }, [
    state.cityData,
    state.propertyPurpose,
    state.subType,
    state.zone,
    state.propertyArea,
    state.coveredBalconyArea,
    state.storageArea,
    state.parkingArea,
  ]);

  const ordinanceUrl = state.cityData?.ordinanceUrl;

  return (
    <Box>
      <Typography variant="h5" textAlign="center" mb={4}>
        תעריף ארנונה
      </Typography>

      {'error' in result ? (
        <Alert severity="error" sx={{ mb: 3 }}>
          {result.error}
        </Alert>
      ) : (
        <>
          <Alert severity="info" sx={{ mb: 3, fontSize: '1.1rem' }}>
            {'תעריף הארנונה באזורך: '}
            <strong>{result.rate} ₪ למ&quot;ר לשנה</strong>
          </Alert>

          {result.propertyCode && (
            <Typography variant="body2" color="text.secondary" mb={2}>
              קוד סיווג: {result.propertyCode} | שטח כולל: {result.totalArea} מ&quot;ר
            </Typography>
          )}

          {ordinanceUrl && (
            <Box mb={3}>
              <Link href={ordinanceUrl} target="_blank" rel="noopener">
                הורדת צו הארנונה (PDF)
              </Link>
            </Box>
          )}
        </>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
        <Button variant="outlined" onClick={() => dispatch({ type: 'PREV_STEP' })}>
          חזרה
        </Button>
        <Button
          variant="contained"
          disabled={'error' in result}
          onClick={() => dispatch({ type: 'NEXT_STEP' })}
        >
          הבא
        </Button>
      </Box>
    </Box>
  );
}
