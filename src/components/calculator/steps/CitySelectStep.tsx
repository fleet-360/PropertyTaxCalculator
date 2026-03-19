'use client';

import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import type { StepProps } from '../CalculatorWizard';

interface CityOption {
  _id: string;
  cityName: string;
  slug: string;
}

export default function CitySelectStep({ state, dispatch }: StepProps) {
  const [cities, setCities] = useState<CityOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<CityOption | null>(null);

  useEffect(() => {
    fetch('/api/cities')
      .then((r) => r.json())
      .then((data) => {
        setCities(Array.isArray(data) ? data : data.cities ?? []);
      })
      .catch(() => setCities([]))
      .finally(() => setLoading(false));
  }, []);

  const handleSelect = async (city: CityOption | null) => {
    setSelected(city);
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

  return (
    <Box>
      <Typography variant="h5" textAlign="center" mb={4}>
        בחר עיר
      </Typography>

      <Autocomplete
        options={cities}
        getOptionLabel={(o) => o.cityName}
        loading={loading}
        value={selected}
        onChange={(_, v) => handleSelect(v)}
        renderInput={(params) => (
          <TextField
            {...params}
            label="חפש עיר"
            InputProps={{
              ...params.InputProps,
              endAdornment: (
                <>
                  {loading && <CircularProgress size={20} />}
                  {params.InputProps.endAdornment}
                </>
              ),
            }}
          />
        )}
        sx={{ mb: 4 }}
      />

      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Button variant="outlined" onClick={() => dispatch({ type: 'PREV_STEP' })}>
          חזרה
        </Button>
        <Button
          variant="contained"
          disabled={!selected || state.isLoading}
          onClick={() => dispatch({ type: 'NEXT_STEP' })}
        >
          הבא
        </Button>
      </Box>
    </Box>
  );
}
