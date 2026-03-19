'use client';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import HomeIcon from '@mui/icons-material/Home';
import BusinessIcon from '@mui/icons-material/Business';
import type { StepProps } from '../CalculatorWizard';

export default function PropertyTypeStep({ dispatch }: StepProps) {
  const handleSelect = (type: 'private' | 'business') => {
    dispatch({ type: 'SET_PROPERTY_TYPE', payload: type });
    dispatch({ type: 'NEXT_STEP' });
  };

  return (
    <Box>
      <Typography variant="h5" textAlign="center" mb={4}>
        בחר סוג נכס
      </Typography>
      <Box sx={{ display: 'flex', gap: 3, justifyContent: 'center', flexWrap: 'wrap' }}>
        <Card
          sx={{
            width: 260,
            border: '2px solid',
            borderColor: 'primary.main',
            transition: 'transform 0.15s',
            '&:hover': { transform: 'scale(1.03)' },
          }}
        >
          <CardActionArea onClick={() => handleSelect('private')} sx={{ p: 3, textAlign: 'center' }}>
            <HomeIcon sx={{ fontSize: 64, color: 'primary.main', mb: 1 }} />
            <CardContent>
              <Typography variant="h6">נכס פרטי</Typography>
              <Typography variant="body2" color="text.secondary">
                דירת מגורים, בית פרטי
              </Typography>
            </CardContent>
          </CardActionArea>
        </Card>

        <Card
          sx={{
            width: 260,
            border: '2px solid',
            borderColor: 'secondary.main',
            transition: 'transform 0.15s',
            '&:hover': { transform: 'scale(1.03)' },
          }}
        >
          <CardActionArea onClick={() => handleSelect('business')} sx={{ p: 3, textAlign: 'center' }}>
            <BusinessIcon sx={{ fontSize: 64, color: 'secondary.main', mb: 1 }} />
            <CardContent>
              <Typography variant="h6">נכס עסקי</Typography>
              <Typography variant="body2" color="text.secondary">
                משרד, חנות, מפעל
              </Typography>
            </CardContent>
          </CardActionArea>
        </Card>
      </Box>
    </Box>
  );
}
