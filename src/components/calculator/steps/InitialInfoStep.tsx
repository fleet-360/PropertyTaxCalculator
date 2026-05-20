'use client';

import { useCallback, useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import StoreOutlinedIcon from '@mui/icons-material/StoreOutlined';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import type { StepProps } from '../CalculatorWizard';
import TaxBillUpload from '../TaxBillUpload';
import { findByPropertyCode } from '@/lib/calculator';

interface CityOption {
  _id: string;
  cityName: string;
  slug: string;
}

export default function InitialInfoStep({ state, dispatch }: StepProps) {
  // ── City list ──
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

  // ── Deferred file upload ──
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

  const canProceed = state.propertyType && selectedCity && !state.isLoading && !isExtracting;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* ── Property type cards ── */}
      <Box>
        <Typography
          sx={(theme) => ({
            fontSize: { xs: '14px', md: '15px' },
            fontWeight: 600,
            color: theme.palette.brand.navyDeep,
            mb: 1.5,
          })}
        >
          בחרו את סוג הנכס
        </Typography>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: { xs: 1.5, md: 2 },
          }}
        >
          {(
            [
              { value: 'private', label: 'בית פרטי', Icon: HomeOutlinedIcon },
              { value: 'business', label: 'נכס עסקי', Icon: StoreOutlinedIcon },
            ] as const
          ).map(({ value, label, Icon }) => {
            const isSelected = state.propertyType === value;
            return (
              <Box
                key={value}
                role="button"
                aria-pressed={isSelected}
                tabIndex={0}
                onClick={() => handleSelectType(value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleSelectType(value);
                  }
                }}
                sx={(theme) => ({
                  cursor: 'pointer',
                  bgcolor: '#fff',
                  border: '2px solid',
                  borderColor: isSelected ? theme.palette.brand.blue : '#e3e7f1',
                  borderRadius: 2.5,
                  py: { xs: 2.5, md: 3 },
                  px: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 1.25,
                  transition: 'all 0.2s ease',
                  boxShadow: isSelected
                    ? `0 8px 20px ${theme.palette.brand.blue}25`
                    : '0 2px 6px rgba(11,26,71,0.04)',
                  '&:hover': {
                    borderColor: theme.palette.brand.blueLight,
                    transform: 'translateY(-2px)',
                  },
                })}
              >
                <Icon
                  sx={(theme) => ({
                    fontSize: { xs: 38, md: 50 },
                    color: isSelected ? theme.palette.brand.blue : theme.palette.brand.navyMid,
                  })}
                />
                <Typography
                  sx={(theme) => ({
                    fontSize: { xs: '14px', md: '16px' },
                    fontWeight: 700,
                    color: theme.palette.brand.navyDeep,
                  })}
                >
                  {label}
                </Typography>
              </Box>
            );
          })}
        </Box>
      </Box>

      {/* ── City Select ── */}
      <Box>
        <Typography
          sx={(theme) => ({
            fontSize: { xs: '14px', md: '15px' },
            fontWeight: 600,
            color: theme.palette.brand.navyDeep,
            mb: 1,
          })}
        >
          עיר / מועצה מקומית
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
              placeholder="בחרו עיר מהרשימה"
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
                  bgcolor: '#fff',
                  '& fieldset': {
                    borderColor: '#e3e7f1',
                  },
                  '&:hover fieldset': {
                    borderColor: (theme) => theme.palette.brand.blueLight,
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: (theme) => theme.palette.brand.blue,
                  },
                },
              }}
            />
          )}
        />
      </Box>

      {/* ── Document Upload ── */}
      <Box>
        <Typography
          sx={(theme) => ({
            fontSize: { xs: '14px', md: '15px' },
            fontWeight: 600,
            color: theme.palette.brand.navyDeep,
            mb: 1,
          })}
        >
          העלאת שובר ארנונה (אופציונלי)
        </Typography>
        <TaxBillUpload
          dispatch={dispatch}
          deferExtraction
          onFileReady={handleFileReady}
          expectedCityName={selectedCity?.cityName ?? state.cityData?.cityName}
        />
      </Box>

      {extractionError && <Alert severity="error">{extractionError}</Alert>}

      {/* ── Continue button ── */}
      <Box sx={{ mt: 'auto', pt: 2, display: 'flex', justifyContent: 'flex-start' }}>
        <Button
          variant="contained"
          disabled={!canProceed}
          onClick={handleNext}
          endIcon={!isExtracting ? <ChevronLeftIcon /> : undefined}
          sx={(theme) => ({
            bgcolor: theme.palette.brand.blue,
            color: '#fff',
            borderRadius: '999px',
            px: 4,
            py: 1.5,
            fontSize: '16px',
            fontWeight: 700,
            boxShadow: `0 10px 24px ${theme.palette.brand.blue}40`,
            '& .MuiButton-endIcon': { ml: 0.75, mr: -0.5 },
            '&:hover': {
              bgcolor: theme.palette.brand.blueDark,
            },
            '&.Mui-disabled': {
              bgcolor: '#cdd2e0',
              color: '#fff',
            },
          })}
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
    </Box>
  );
}
