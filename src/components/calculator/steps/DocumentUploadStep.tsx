'use client';

import { useCallback, useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import type { StepProps } from '../CalculatorWizard';
import TaxBillUpload from '../TaxBillUpload';
import { findByPropertyCode } from '@/lib/calculator';

export default function DocumentUploadStep({ state, dispatch }: StepProps) {
  const [extracted, setExtracted] = useState(false);

  const handleExtracted = useCallback(() => {
    setExtracted(true);
  }, []);

  // Auto-resolve classification fields from propertyCode after extraction
  useEffect(() => {
    if (!extracted || !state.cityData || !state.classificationCode) return;

    const match = findByPropertyCode(state.cityData, state.classificationCode);
    console.log('match', match);
    if (match) {
      dispatch({
        type: 'UPDATE_FIELDS_BULK',
        payload: {
          propertyPurpose: match.typeCode,
          subType: match.subtypeCode,
          zone: match.zoneCode,
        },
      });
    }
  }, [extracted, state.cityData, state.classificationCode, dispatch]);

  return (
    <Box>
      <Typography variant="h5" textAlign="center" mb={3}>
        סריקת שובר ארנונה
      </Typography>

      <Typography variant="body2" color="text.secondary" textAlign="center" mb={3}>
        ניתן להעלות צילום של שובר הארנונה למילוי אוטומטי של הפרטים, או לדלג ולמלא ידנית.
      </Typography>

      <TaxBillUpload
        dispatch={dispatch}
        onExtracted={handleExtracted}
        expectedCityName={state.cityData?.cityName}
        cityData={state.cityData}
      />

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
        <Button variant="outlined" onClick={() => dispatch({ type: 'PREV_STEP' })}>
          חזרה
        </Button>
        <Button variant="contained" onClick={() => dispatch({ type: 'NEXT_STEP' })}>
          {extracted ? 'הבא' : 'דלג'}
        </Button>
      </Box>
    </Box>
  );
}
