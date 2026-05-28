'use client';

import { useCallback, useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import CircularProgress from '@mui/material/CircularProgress';
import Button from '@mui/material/Button';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import type { StepProps } from '../CalculatorWizard';
import TaxBillUpload from '../TaxBillUpload';
import { useBillExtraction } from '../BillExtractionContext';
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
  const { startExtraction, resetExtraction } = useBillExtraction();

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

  const handleFileReady = useCallback(
    (file: File | null) => {
      setPendingFile(file);
      // A new file invalidates any previous extraction state so the next step
      // doesn't auto-advance on stale results.
      if (state.extractionStatus !== 'idle') {
        resetExtraction();
      }
    },
    [resetExtraction, state.extractionStatus],
  );

  const handleNext = useCallback(() => {
    if (pendingFile) {
      void startExtraction({
        file: pendingFile,
        expectedCityName: selectedCity?.cityName ?? state.cityData?.cityName,
        cityData: state.cityData,
      });
    }
    dispatch({ type: 'NEXT_STEP' });
  }, [pendingFile, startExtraction, selectedCity?.cityName, state.cityData, dispatch]);

  const canProceed = Boolean(selectedCity) && !state.isLoading;

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
          endIcon={<ChevronLeftIcon />}
          sx={wizardPrimaryButtonSx}
        >
          לשלב הבא
        </Button>
      </Box>
    </Box>
  );
}
