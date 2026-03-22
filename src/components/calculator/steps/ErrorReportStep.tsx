'use client';

import { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import type { StepProps } from '../CalculatorWizard';
import { IPropertyType, ISubType } from '@/lib/models/CityTariff';

export default function ErrorReportStep({ state, dispatch }: StepProps) {
  const [claimedArea, setClaimedArea] = useState<number>(state.measurementError?.claimed ?? 0);
  const [suggestedClass, setSuggestedClass] = useState(state.classificationError?.suggested ?? '');

  const subtypes: ISubType[] = state.cityData?.types.flatMap((t: IPropertyType) => t.subtypes) ?? [];

  const handleNext = () => {
    if (claimedArea > 0) {
      dispatch({
        type: 'SET_MEASUREMENT_ERROR',
        payload: { claimed: claimedArea, attachment: '' },
      });
    }
    if (suggestedClass) {
      dispatch({
        type: 'SET_CLASSIFICATION_ERROR',
        payload: { suggested: suggestedClass },
      });
    }
    dispatch({ type: 'NEXT_STEP' });
  };

  return (
    <Box>
      <Typography variant="h5" textAlign="center" mb={2}>
        דיווח על שגיאות (אופציונלי)
      </Typography>
      <Typography variant="body2" color="text.secondary" textAlign="center" mb={4}>
        אם אתה סבור שיש שגיאה בנתוני הנכס שלך, תוכל לדווח כאן
      </Typography>

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>טעות במדידה</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <TextField
            label='שטח מתוקן (מ"ר)'
            type="number"
            value={claimedArea || ''}
            onChange={(e) => setClaimedArea(Number(e.target.value))}
            fullWidth
            sx={{ mb: 2 }}
          />
          <Button variant="outlined" size="small" disabled>
            צרף קובץ מדידה (בקרוב)
          </Button>
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>טעות בסיווג</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <TextField
            label="סיווג מוצע"
            select
            value={suggestedClass}
            onChange={(e) => setSuggestedClass(e.target.value)}
            fullWidth
          >
            <MenuItem value="">בחר</MenuItem>
            {subtypes.map((s: ISubType) => (
              <MenuItem key={s.code} value={s.code}>
                {s.label} 
              </MenuItem> 
            ))}
          </TextField>
        </AccordionDetails>
      </Accordion>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
        <Button variant="outlined" onClick={() => dispatch({ type: 'PREV_STEP' })}>
          חזרה
        </Button>
        <Button variant="contained" onClick={handleNext}>
          הבא
        </Button>
      </Box>
    </Box>
  );
}
