'use client';

import { useCallback, useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import type { StepProps } from '../CalculatorWizard';
import TaxBillUpload from '../TaxBillUpload';
import { findByPropertyCode } from '@/lib/calculator';
import {
  wizardFieldSx,
  wizardInstructionSx,
  wizardNavRowSx,
  wizardPrimaryButtonSx,
  wizardSecondaryButtonSx,
} from '../wizardStyles';

interface CityOption {
  _id: string;
  cityName: string;
  slug: string;
}

export default function CityBillStep({ state, dispatch }: StepProps) {
  const [cities, setCities] = useState<CityOption[]>([]);
  const [loadingCities, setLoadingCities] = useState(true);
  const [selectedCity, setSelectedCity] = useState<CityOption | null>(
    state.cityData
      ? {
          _id: state.cityData._id,
          cityName: state.cityData.cityName,
          slug: state.cityData.slug,
        }
      : null,
  );

  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionError, setExtractionError] = useState('');

  useEffect(() => {
    dispatch({ type: 'SET_MIA_MESSAGE', payload: 'step-0-default' });
  }, [dispatch]);

  useEffect(() => {
    fetch('/api/cities')
      .then((r) => r.json())
      .then((data) => setCities(Array.isArray(data) ? data : data.cities ?? []))
      .catch(() => setCities([]))
      .finally(() => setLoadingCities(false));
  }, []);

  const handleSelectCity = async (city: CityOption | null) => {
    setSelectedCity(city);
    setExtractionError('');
    if (city) {
      dispatch({ type: 'SET_CITY', payload: { slug: city.slug } });
      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        const res = await fetch(`/api/cities/${city._id}`);
        const data = await res.json();
        dispatch({ type: 'SET_CITY_DATA', payload: data });
      } catch {
        // ignore
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    }
  };

  const handleFileReady = useCallback((file: File | null) => {
    setPendingFile(file);
    setExtractionError('');
  }, []);

  const handleNext = useCallback(async () => {
    if (pendingFile) {
      setIsExtracting(true);
      setExtractionError('');
      try {
        const formData = new FormData();
        formData.append('file', pendingFile);
        formData.append('documentType', 'tax_bill');
        const trimmedCity = (selectedCity?.cityName ?? state.cityData?.cityName)?.trim();
        if (trimmedCity) {
          formData.append('promptOptions', JSON.stringify({ expectedCityName: trimmedCity }));
        }

        const response = await fetch('/api/vision/extract', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          let msg = 'שגיאה בעיבוד המסמך';
          try {
            const errData = await response.json();
            if (typeof errData?.error === 'string') msg = errData.error;
          } catch {
            /* ignore */
          }
          setExtractionError(msg);
          return;
        }

        const result = await response.json();
        if (!result.success) {
          const w = Array.isArray(result.warnings) ? result.warnings.join('. ') : '';
          setExtractionError(w || 'לא ניתן היה לחלץ נתונים מהמסמך');
          return;
        }

        if (result.data) {
          const fieldsToApply: Record<string, unknown> = {};
          for (const [key, field] of Object.entries(result.data)) {
            const f = field as { value?: unknown };
            if (f && f.value !== undefined && f.value !== null) {
              if (key === 'bimonthlyPayment') {
                fieldsToApply['reportedPayment'] = f.value;
              } else if (
                key === 'propertyPurposeDescription' ||
                key === 'subTypeDescription' ||
                key === 'ratePerSqm' ||
                key === 'annualPayment'
              ) {
                // display-only fields
              } else {
                fieldsToApply[key] = f.value;
              }
            }
          }
          dispatch({ type: 'UPDATE_FIELDS_BULK', payload: fieldsToApply });

          if (fieldsToApply.classificationCode && state.cityData) {
            const match = findByPropertyCode(
              state.cityData,
              fieldsToApply.classificationCode as string,
            );
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
          }
        }
      } catch {
        setExtractionError('שגיאה בעיבוד המסמך');
        return;
      } finally {
        setIsExtracting(false);
      }
    }
    dispatch({ type: 'NEXT_STEP' });
  }, [pendingFile, dispatch, state.cityData, selectedCity?.cityName]);

  const canProceed = Boolean(selectedCity) && !state.isLoading && !isExtracting;

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: 3,
        width: '100%',
        maxWidth: 547,
      }}
    >
      <Box sx={{ width: '100%' }}>
        <Typography sx={wizardInstructionSx}>בחרו עיר מתוך הרשימה</Typography>
        <Autocomplete
          options={cities}
          getOptionLabel={(o) => o.cityName}
          loading={loadingCities}
          value={selectedCity}
          onChange={(_, v) => handleSelectCity(v)}
          size="small"
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder="בחירת עיר / מועצה"
              sx={wizardFieldSx}
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {loadingCities && <CircularProgress size={20} />}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
            />
          )}
        />
      </Box>

      <Box sx={{ width: '100%' }}>
        <TaxBillUpload
          dispatch={dispatch}
          deferExtraction
          onFileReady={handleFileReady}
          expectedCityName={selectedCity?.cityName ?? state.cityData?.cityName}
        />
      </Box>

      {extractionError && <Alert severity="error">{extractionError}</Alert>}

      <Box sx={{ ...wizardNavRowSx, width: '100%' }}>
        <Button
          variant="outlined"
          onClick={() => dispatch({ type: 'PREV_STEP' })}
          startIcon={<ChevronRightIcon />}
          sx={wizardSecondaryButtonSx}
        >
          לשלב הקודם
        </Button>
        <Button
          variant="contained"
          disabled={!canProceed}
          onClick={handleNext}
          endIcon={!isExtracting ? <ChevronLeftIcon /> : undefined}
          sx={wizardPrimaryButtonSx}
        >
          {isExtracting ? (
            <>
              <CircularProgress size={20} sx={{ mr: 1 }} color="inherit" />
              מחלץ נתונים...
            </>
          ) : (
            'לשלב הבא'
          )}
        </Button>
      </Box>
    </Box>
  );
}
