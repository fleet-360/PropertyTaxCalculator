'use client';

import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Link from '@mui/material/Link';
import type { StepProps } from '../CalculatorWizard';

export default function RateInfoStep({ state, dispatch }: StepProps) {
  const [rate, setRate] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchRate = async () => {
      try {
        const res = await fetch('/api/tax-rates/calculate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            citySlug: state.citySlug,
            propertyType: state.propertyType,
            propertyArea: state.propertyArea,
            zone: state.zone,
            subType: state.subType,
            classificationCode: state.classificationCode,
            designations: state.designations,
          }),
        });
        const data = await res.json();
        setRate(data.rate ?? data.ratePerSqm ?? null);
      } catch {
        setError('שגיאה בטעינת התעריף');
      } finally {
        setLoading(false);
      }
    };
    fetchRate();
  }, [state.citySlug, state.propertyType, state.propertyArea, state.zone, state.subType, state.classificationCode, state.designations]);

  const ordinancePdfUrl = state.cityData?.ordinancePdfUrl;

  return (
    <Box>
      <Typography variant="h5" textAlign="center" mb={4}>
        תעריף ארנונה
      </Typography>

      {loading ? (
        <Box textAlign="center" py={4}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      ) : (
        <>
          <Alert severity="info" sx={{ mb: 3, fontSize: '1.1rem' }}>
            {'תעריף הארנונה באזורך: '}
            <strong>{rate ?? '---'} ₪ למ&quot;ר לשנה</strong>
          </Alert>

          {ordinancePdfUrl && (
            <Box mb={3}>
              <Link href={ordinancePdfUrl} target="_blank" rel="noopener">
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
        <Button variant="contained" disabled={loading} onClick={() => dispatch({ type: 'NEXT_STEP' })}>
          הבא
        </Button>
      </Box>
    </Box>
  );
}
