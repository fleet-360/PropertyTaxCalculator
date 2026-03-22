'use client';

import { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import type { StepProps } from '../CalculatorWizard';

const APPEAL_WAIVER_TEXT = `הנני מצהיר/ה ומאשר/ת כי ידוע לי שהגשת השגה באמצעות מחשבון הארנונה אינה מהווה ייעוץ משפטי. הנני מוותר/ת על כל טענה כלפי מפעילי המחשבון בנוגע לתוצאות ההשגה ו/או לכל נזק שעלול להיגרם כתוצאה מהגשתה. ידוע לי כי ההשגה מוגשת על בסיס הנתונים שהזנתי במחשבון ועל אחריותי בלבד.`;

export default function AppealStep({ state, dispatch }: StepProps) {
  const [appealWaiverAccepted, setAppealWaiverAccepted] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    // Mock payment & submission
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <Box>
        <Alert severity="success" sx={{ mb: 3, fontSize: '1.1rem' }}>
          ההשגה נשלחה למייל שלך ({state.email || 'לא הוזן מייל'})
        </Alert>
        <Typography textAlign="center" color="text.secondary">
          תודה שהשתמשת במחשבון הארנונה
        </Typography>
        <Box textAlign="center" mt={4}>
          <Button variant="outlined" href="/">
            חזרה לדף הבית
          </Button>
        </Box>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" textAlign="center" mb={3}>
        הגשת השגה
      </Typography>

      <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
        <Typography variant="body1" mb={2}>
          השגה היא בעצם ערעור על חיוב הארנונה. ניתן להגיש השגה תוך 90 יום ממועד קבלת החיוב.
        </Typography>
        <Typography variant="body1" mb={2}>
          בלחיצה אחת נוכל להכין עבורך השגה שמתאימה למידע שהזנת במחשבון.
        </Typography>
        <Typography variant="h6" color="primary.main">
          מחיר: 180₪
        </Typography>
      </Paper>

      {/* Appeal-specific waiver */}
      <Paper variant="outlined" sx={{ p: 2, mb: 2, maxHeight: 140, overflowY: 'auto', lineHeight: 1.8 }}>
        <Typography variant="body2">{APPEAL_WAIVER_TEXT}</Typography>
      </Paper>

      <FormControlLabel
        control={
          <Checkbox
            checked={appealWaiverAccepted}
            onChange={(e) => setAppealWaiverAccepted(e.target.checked)}
          />
        }
        label="קראתי את מכתב הויתור ואני מסכים/ה ומאשר/ת"
        sx={{ mb: 3 }}
      />

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
        <Button variant="outlined" onClick={() => dispatch({ type: 'PREV_STEP' })}>
          חזרה
        </Button>
        <Button variant="contained" disabled={!appealWaiverAccepted} onClick={handleSubmit}>
          תשלום והכנת השגה
        </Button>
      </Box>
    </Box>
  );
}
