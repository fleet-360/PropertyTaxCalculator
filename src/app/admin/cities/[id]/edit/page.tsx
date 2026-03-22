'use client';
import * as React from 'react';
import { useParams } from 'next/navigation';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Skeleton from '@mui/material/Skeleton';
import Alert from '@mui/material/Alert';
import CityTariffEditor from '@/components/admin/CityTariffEditor';

export default function EditCityPage() {
  const params = useParams();
  const id = params.id as string;
  const [city, setCity] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    async function fetchCity() {
      try {
        setLoading(true);
        const res = await fetch(`/api/cities/${id}`);
        if (!res.ok) throw new Error('City not found');
        const data = await res.json();
        setCity(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load city');
      } finally {
        setLoading(false);
      }
    }
    fetchCity();
  }, [id]);

  if (loading) {
    return (
      <Box>
        <Skeleton width={300} height={40} sx={{ mb: 2 }} />
        <Skeleton width="100%" height={200} />
        <Skeleton width="100%" height={200} sx={{ mt: 2 }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!city) {
    return (
      <Box>
        <Typography>עיר לא נמצאה</Typography>
      </Box>
    );
  }

  return <CityTariffEditor city={city} />;
}
