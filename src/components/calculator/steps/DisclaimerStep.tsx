'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Button from '@mui/material/Button';
import type { StepProps } from '../CalculatorWizard';

const DISCLAIMER_TEXT = `הנני מצהיר/ה ומאשר/ת כי מחשבון הארנונה אינו מהווה ייעוץ משפטי ו/או תחליף לייעוץ משפטי, וכי תוצאות החישוב מבוססות על הנתונים שהזנתי במחשבון ולצורך התמצאות בלבד. לאחר שעיינתי בתקנון האתר ובמדיניות הפרטיות, הנני מצהיר/ה כי לא אעלה באופן אישי ו/או באמצעות מי מטעמי כל טענה ו/או תלונה ו/או תביעה כנגד מחשבון הארנונה ומנהליו בכל מקרה של שימוש במחשבון הארנונה ובמקרה של סטייה מהתוצאה המופיעה בצו הארנונה.`;

export default function DisclaimerStep({ state, dispatch }: StepProps) {
  return (
    <Box>
      <Typography variant="h5" textAlign="center" mb={3}>
        הצהרה ואישור
      </Typography>

      <Paper
        variant="outlined"
        sx={{ p: 3, mb: 3, maxHeight: 260, overflowY: 'auto', lineHeight: 1.8 }}
      >
        <Typography variant="body1">{DISCLAIMER_TEXT}</Typography>
      </Paper>

      <FormControlLabel
        control={
          <Checkbox
            checked={state.consentGiven}
            onChange={(e) =>
              dispatch({ type: 'UPDATE_FIELD', field: 'consentGiven', value: e.target.checked })
            }
          />
        }
        label="קראתי את התקנון ומדיניות הפרטיות ואני מסכים/ה ומאשר/ת"
      />

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
        <Button variant="outlined" onClick={() => dispatch({ type: 'PREV_STEP' })}>
          חזרה
        </Button>
        <Button
          variant="contained"
          disabled={!state.consentGiven}
          onClick={() => {
            // Trigger calculation before advancing
            dispatch({ type: 'SET_LOADING', payload: true });
            fetch('/api/tax-rates/calculate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                citySlug: state.citySlug,
                propertyType: state.propertyPurpose,
                subType: state.subType,
                zone: state.zone,
                propertyAreaSqm: state.propertyArea,
                coveredBalconySqm: state.coveredBalconyArea,
                storageSqm: state.storageArea,
                parkingSqm: state.parkingArea,
                bimonthlyPayment: state.bimonthlyPayment,
                selectedExemptionCodes: state.selectedExemptions
                  .filter((e) => e.subSectionCode)
                  .map((e) => e.subSectionCode),
                householdSize: state.householdSize,
                childrenCount: state.childrenCount,
                correctedAreaSqm: state.measurementError?.claimed,
                designations: state.propertyType === 'business'
                  ? state.designations.map((d) => ({
                      typeCode: d.type,
                      subtypeCode: d.subtype,
                      zone: d.zone,
                      areaSqm: d.area,
                    }))
                  : undefined,
              }),
            })
              .then((r) => {
                if (!r.ok) throw new Error(`HTTP ${r.status}`);
                return r.json();
              })
              .then((data) => {
                dispatch({ type: 'SET_CALCULATION_RESULT', payload: data });
                dispatch({ type: 'SET_LOADING', payload: false });
                dispatch({ type: 'NEXT_STEP' });
              })
              .catch(() => {
                // Route to contact redirect on any calculation error
                dispatch({ type: 'SET_LOADING', payload: false });
                dispatch({ type: 'SET_CONTACT_REDIRECT', payload: 'error' });
              });
          }}
        >
          חשב תוצאות
        </Button>
      </Box>
    </Box>
  );
}
