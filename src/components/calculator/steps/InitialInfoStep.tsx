'use client';

import { useCallback, useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import CheckIcon from '@mui/icons-material/Check';
import type { StepProps } from '../CalculatorWizard';
import TaxBillUpload from '../TaxBillUpload';
import { findByPropertyCode } from '@/lib/calculator';
import { ButtonGroup, Theme } from '@mui/material';

interface CityOption {
  _id: string;
  cityName: string;
  slug: string;
}

export default function InitialInfoStep({ state, dispatch, sx }: StepProps) {
  // ── City list ──
  const [cities, setCities] = useState<CityOption[]>([]);
  const [loadingCities, setLoadingCities] = useState(true);
  const [selectedCity, setSelectedCity] = useState<CityOption | null>(state.cityData ? {
    _id: state.cityData._id,
    cityName: state.cityData.cityName,
    slug: state.cityData.slug,
  } : null);

  // ── Deferred file upload ──
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionError, setExtractionError] = useState('');

  // ── Mia message on mount ──
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

  // ── Property type selection ──
  const handleSelectType = (value: 'private' | 'business') => {
    dispatch({ type: 'SET_PROPERTY_TYPE', payload: value });
    dispatch({
      type: 'SET_MIA_MESSAGE',
      payload: value === 'private' ? 'step-0-private' : 'step-0-business',
    });
  };

  // ── City selection ──
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

  // ── File ready callback (deferred mode) ──
  const handleFileReady = useCallback((file: File | null) => {
    setPendingFile(file);
    setExtractionError('');
  }, []);

  // ── Handle "המשך לשלב הבא" click — extract if file pending, then advance ──
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
              } else if (key === 'propertyPurposeDescription' || key === 'subTypeDescription' ||
                         key === 'ratePerSqm' || key === 'annualPayment') {
                // display-only fields
              } else {
                fieldsToApply[key] = f.value;
              }
            }
          }
          dispatch({ type: 'UPDATE_FIELDS_BULK', payload: fieldsToApply });

          if (fieldsToApply.classificationCode && state.cityData) {
            const match = findByPropertyCode(state.cityData, fieldsToApply.classificationCode as string);
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

  const canProceed = state.propertyType && selectedCity && !state.isLoading && !isExtracting;

  return (
    <Box sx={{...sx}}>
      {/* ── Title ── */}
      <Typography
        sx={{
          fontWeight: 700,
          fontSize: '18px',
          color: '#0c0c0c',
          textAlign: 'center',
          mb: 0.5,
        }}
      >
        מחשבון חכם
      </Typography>
      <Typography
        sx={{
          fontWeight: 700,
          fontSize: '15px',
          color: '#0c0c0c',
          textAlign: 'center',
          mb: 2,
        }}
      >
        הזנת נתוני נכס
      </Typography>

      {/* ── 1. Property Type ── */}
      <ButtonGroup sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
        {(['private', 'business'] as const).map((type) => {
          const isSelected = state.propertyType === type;
          const label = type === 'private' ? 'נכס פרטי' : 'נכס עסקי';
          const icon=<CheckIcon sx={{ fontSize: '18px !important', visibility: isSelected ? 'visible' : 'hidden' }} />
          return (
            <Button
              key={type}
              onClick={() => handleSelectType(type)}
              variant="contained"
              disableElevation
              startIcon={ type === 'private' ? icon : undefined}
              endIcon={ type === 'business' ? icon : undefined}
              sx={{
                border:(theme: Theme)=>`1px solid ${theme.palette.primary.light}`,
                borderRadius: '24px',
                px: 3,
                py: 1,
                fontSize: '14px',
                fontWeight: 600,
                textTransform: 'none',
                bgcolor: isSelected ? '#F28B00' : '#f0f2f5',
                color: isSelected ? '#fff' : '#333',
                '&:hover': {
                  bgcolor: isSelected ? '#C66D00' : '#e4e6ea',
                },
              }}
            >
              {label}
            </Button>
          );
        })}
      </ButtonGroup>

      {/* ── 2. City Select ── */}
      <Typography
        sx={{
          fontSize: '14px',
          color: '#333',
          fontWeight: 600,
          
        }}
      >
        עיר/ מועצה מקומית
      </Typography>
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
            placeholder="בחירו עיר מהרשימה"
            InputProps={{
              ...params.InputProps,
              endAdornment: (
                <>
                  {loadingCities && <CircularProgress size={20} />}
                  {params.InputProps.endAdornment}
                </>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '10px',
                '& fieldset': {
                  borderColor: '#d2d2d2',
                },
              },
            }}
          />
        )}
        sx={{ mb: 4 }}
      />

      {/* ── 3. Document Upload (deferred — extraction on "הבא") ── */}
      <Typography
        sx={{
          fontSize: '14px',
          color: '#333',
          fontWeight: 600,
        }}
      >
        העלאת שובר ארנונה
      </Typography>
      <TaxBillUpload
        dispatch={dispatch}
        deferExtraction
        onFileReady={handleFileReady}
        expectedCityName={selectedCity?.cityName ?? state.cityData?.cityName}
      />

      {extractionError ? (
        <Alert severity="error" sx={{ mt: 2, mb: 1 }}>
          {extractionError}
        </Alert>
      ) : null}

      {/* ── Navigation ── */}
      <Button
        variant="contained"
        disabled={!canProceed}
        onClick={handleNext}
        fullWidth
        sx={{
          bgcolor: '#1a1a1a',
          color: '#fff',
          borderRadius: '12px',
          py: 1.5,
          fontSize: '16px',
          fontWeight: 700,
          textTransform: 'none',
          '&:hover': {
            bgcolor: '#F28B00',
          },
          '&.Mui-disabled': {
            bgcolor: '#d4d4d4',
            color: '#fff',
          },
        }}
      >
        {isExtracting ? (
          <>
            <CircularProgress size={20} sx={{ mr: 1 }} color="inherit" />
            מחלץ נתונים...
          </>
        ) : (
          'המשך לשלב הבא'
        )}
      </Button>
    </Box>
  );
}
