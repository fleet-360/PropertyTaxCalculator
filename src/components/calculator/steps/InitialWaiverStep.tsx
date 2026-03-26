'use client';

import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Button from '@mui/material/Button';
import type { StepProps } from '../CalculatorWizard';

const INITIAL_WAIVER_TEXT = `הנני מצהיר/ה ומאשר/ת כי מחשבון הארנונה אינו מהווה ייעוץ משפטי ו/או תחליף לייעוץ משפטי, וכי תוצאות החישוב מבוססות על הנתונים שאזין במחשבון ולצורך התמצאות בלבד.`;

export default function InitialWaiverStep({ dispatch }: StepProps) {
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    dispatch({ type: 'SET_MIA_MESSAGE', payload: 'step-1-default' });
  }, [dispatch]);

  return (
    <Box>
      <Typography
        sx={{
          fontWeight: 700,
          fontSize: '18px',
          color: '#0c0c0c',
          textAlign: 'center',
          mb: 3,
        }}
      >
        אישור תנאים
      </Typography>

      <Paper
        variant="outlined"
        sx={{
          p: 2.5,
          mb: 2,
          maxHeight: 160,
          overflowY: 'auto',
          lineHeight: 1.8,
          borderRadius: '10px',
          borderColor: '#d2d2d2',
        }}
      >
        <Typography variant="body2" sx={{ color: '#333' }}>
          {INITIAL_WAIVER_TEXT}
        </Typography>
      </Paper>

      <FormControlLabel
        control={
          <Checkbox
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
          />
        }
        label="קראתי ואני מסכים/ה"
        sx={{ mb: 3 }}
      />

      {/* ── Navigation ── */}
      <Box sx={{ display: 'flex', gap: 2 }}>
        <Button
          variant="outlined"
          onClick={() => dispatch({ type: 'PREV_STEP' })}
          sx={{
            borderRadius: '12px',
            py: 1.5,
            fontSize: '14px',
            fontWeight: 600,
            textTransform: 'none',
            flex: '0 0 auto',
            px: 4,
            borderColor: '#d2d2d2',
            color: '#333',
            '&:hover': {
              borderColor: '#999',
              bgcolor: '#f5f5f5',
            },
          }}
        >
          חזרה
        </Button>
        <Button
          variant="contained"
          disabled={!accepted}
          onClick={() => dispatch({ type: 'NEXT_STEP' })}
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
          המשך לשלב הבא
        </Button>
      </Box>
    </Box>
  );
}
