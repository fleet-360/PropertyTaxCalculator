'use client';

import { useCallback, useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import CircularProgress from '@mui/material/CircularProgress';
import Button from '@mui/material/Button';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Paper from '@mui/material/Paper';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import HomeIcon from '@mui/icons-material/Home';
import BusinessIcon from '@mui/icons-material/Business';
import type { StepProps } from '../CalculatorWizard';
import TaxBillUpload from '../TaxBillUpload';
import { findByPropertyCode } from '@/lib/calculator';

const INITIAL_WAIVER_TEXT = `הנני מצהיר/ה ומאשר/ת כי מחשבון הארנונה אינו מהווה ייעוץ משפטי ו/או תחליף לייעוץ משפטי, וכי תוצאות החישוב מבוססות על הנתונים שאזין במחשבון ולצורך התמצאות בלבד.`;

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

  // ── Initial waiver ──
  const [initialWaiverAccepted, setInitialWaiverAccepted] = useState(false);

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
  const handleSelectType = (_: React.MouseEvent<HTMLElement>, value: string | null) => {
    if (value === 'private' || value === 'business') {
      dispatch({ type: 'SET_PROPERTY_TYPE', payload: value });
    }
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

  // ── Handle "הבא" click — extract if file pending, then advance ──
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

  const canProceed = state.propertyType && selectedCity && !state.isLoading && initialWaiverAccepted && !isExtracting;

  return (
    <Box>
      {/* ── 1. Property Type ── */}
      <Typography variant="h5" textAlign="center" mb={3}>
        בחר סוג נכס
      </Typography>
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
        <ToggleButtonGroup
          value={state.propertyType}
          exclusive
          onChange={handleSelectType}
          size="large"
          sx={{
            '& .MuiToggleButton-root': {
              px: 4,
              py: 1.5,
              gap: 1,
            },
          }}
        >
          <ToggleButton value="private">
            <HomeIcon />
            נכס פרטי
          </ToggleButton>
          <ToggleButton value="business">
            <BusinessIcon />
            נכס עסקי
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* ── 2. City Select ── */}
      <Typography variant="h6" textAlign="center" mb={2}>
        בחר עיר
      </Typography>
      <Autocomplete
        options={cities}
        getOptionLabel={(o) => o.cityName}
        loading={loadingCities}
        value={selectedCity}
        onChange={(_, v) => handleSelectCity(v)}
        renderInput={(params) => (
          <TextField
            {...params}
            label="חפש עיר"
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
        sx={{ mb: 4 }}
      />

      {/* ── 3. Document Upload (deferred — extraction on "הבא") ── */}
      <Typography variant="h6" textAlign="center" mb={1}>
        סריקת שובר ארנונה
      </Typography>
      <Typography variant="body2" color="text.secondary" textAlign="center" mb={2}>
        ניתן להעלות צילום של שובר הארנונה למילוי אוטומטי של הפרטים, או לדלג ולמלא ידנית.
      </Typography>
      <TaxBillUpload
        dispatch={dispatch}
        deferExtraction
        onFileReady={handleFileReady}
      />

      {/* ── 4. Initial Waiver ── */}
      <Paper variant="outlined" sx={{ p: 2, mt: 2, mb: 2, maxHeight: 120, overflowY: 'auto', lineHeight: 1.8 }}>
        <Typography variant="body2">{INITIAL_WAIVER_TEXT}</Typography>
      </Paper>
      <FormControlLabel
        control={
          <Checkbox
            checked={initialWaiverAccepted}
            onChange={(e) => setInitialWaiverAccepted(e.target.checked)}
          />
        }
        label="קראתי ואני מסכים/ה"
      />

      {/* ── Navigation ── */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4 }}>
        <Button
          variant="contained"
          disabled={!canProceed}
          onClick={handleNext}
        >
          {isExtracting ? (
            <>
              <CircularProgress size={20} sx={{ mr: 1 }} color="inherit" />
              מחלץ נתונים...
            </>
          ) : (
            'הבא'
          )}
        </Button>
      </Box>
    </Box>
  );
}
