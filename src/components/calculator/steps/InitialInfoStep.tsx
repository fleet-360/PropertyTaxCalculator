'use client';

import { useCallback, useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import CircularProgress from '@mui/material/CircularProgress';
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

export default function InitialInfoStep({ state, dispatch }: StepProps) {
  // ── City list ──
  const [cities, setCities] = useState<CityOption[]>([]);
  const [loadingCities, setLoadingCities] = useState(true);
  const [selectedCity, setSelectedCity] = useState<CityOption | null>(null);

  // ── Deferred file upload ──
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);

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
  };

  // ── City selection ──
  const handleSelectCity = async (city: CityOption | null) => {
    setSelectedCity(city);
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
  }, []);

  // ── Handle "המשך לשלב הבא" click — extract if file pending, then advance ──
  const handleNext = useCallback(async () => {
    if (pendingFile) {
      setIsExtracting(true);
      try {
        const formData = new FormData();
        formData.append('file', pendingFile);
        formData.append('documentType', 'tax_bill');

        const response = await fetch('/api/vision/extract', {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
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

            // Auto-resolve classification
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
        }
      } catch {
        // Extraction failed — continue without extracted data
      } finally {
        setIsExtracting(false);
      }
    }
    dispatch({ type: 'NEXT_STEP' });
  }, [pendingFile, dispatch, state.cityData]);

  const canProceed = state.propertyType && selectedCity && !state.isLoading && !isExtracting;

  return (
    <Box>
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
          mb: 3,
        }}
      >
        הזנת נתוני נכס
      </Typography>

      {/* ── 1. Property Type ── */}
      <ButtonGroup sx={{ display: 'flex', justifyContent: 'center',mb:4, width: '100%' }}>
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
                bgcolor: isSelected ? '#1a4fdb' : '#f0f2f5',
                color: isSelected ? '#fff' : '#333',
                '&:hover': {
                  bgcolor: isSelected ? '#1540b8' : '#e4e6ea',
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
          mb: 1,
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
          mb: 1,
        }}
      >
        העלאת שובר ארנונה
      </Typography>
      <TaxBillUpload
        dispatch={dispatch}
        deferExtraction
        onFileReady={handleFileReady}
      />

      {/* ── Navigation ── */}
      <Button
        variant="contained"
        disabled={!canProceed}
        onClick={handleNext}
        fullWidth
        sx={{
          bgcolor: '#1a4fdb',
          color: '#fff',
          borderRadius: '12px',
          py: 1.5,
          fontSize: '16px',
          fontWeight: 700,
          textTransform: 'none',
          '&:hover': {
            bgcolor: '#1540b8',
          },
          '&.Mui-disabled': {
            bgcolor: '#b0c4f5',
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
