'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import type { StepProps } from '../CalculatorWizard';

interface ExemptionSubsection {
  id: string;
  label: string;
  description?: string;
  discountPercent: number;
  minHouseholdSize?: number;
  minChildren?: number;
}

interface ExemptionSection {
  sectionLabel: string;
  subsections: ExemptionSubsection[];
}

export default function ExemptionsStep({ state, dispatch }: StepProps) {
  const exemptionSections: ExemptionSection[] = state.cityData?.exemptions ?? [];

  const handleExemptionChange = (value: string) => {
    dispatch({ type: 'UPDATE_FIELD', field: 'selectedExemption', value });
  };

  // Find the currently selected subsection to check restrictions
  const selectedSub = exemptionSections
    .flatMap((s) => s.subsections)
    .find((sub) => sub.id === state.selectedExemption);

  return (
    <Box>
      <Typography variant="h5" textAlign="center" mb={2}>
        הנחות וזכאויות
      </Typography>

      <Alert severity="warning" sx={{ mb: 3 }}>
        שים לב: לא ניתן לקבל כפל הנחות. תחול ההנחה הגבוהה ביותר בלבד
      </Alert>

      {exemptionSections.length === 0 && (
        <Typography color="text.secondary" textAlign="center" py={4}>
          לא נמצאו הנחות זמינות לעיר זו
        </Typography>
      )}

      {exemptionSections.map((section) => (
        <Paper key={section.sectionLabel} sx={{ p: 2, mb: 2 }} variant="outlined">
          <Typography variant="subtitle1" fontWeight={600} mb={1}>
            {section.sectionLabel}
          </Typography>
          <RadioGroup value={state.selectedExemption} onChange={(e) => handleExemptionChange(e.target.value)}>
            {section.subsections.map((sub) => (
              <FormControlLabel
                key={sub.id}
                value={sub.id}
                control={<Radio />}
                label={
                  <Box>
                    <Typography variant="body2">
                      {sub.label} — {sub.discountPercent}% הנחה
                    </Typography>
                    {sub.description && (
                      <Typography variant="caption" color="text.secondary">
                        {sub.description}
                      </Typography>
                    )}
                  </Box>
                }
              />
            ))}
          </RadioGroup>
        </Paper>
      ))}

      {/* Restriction inputs */}
      {selectedSub && (selectedSub.minHouseholdSize || selectedSub.minChildren) && (
        <Paper sx={{ p: 2, mb: 2 }} variant="outlined">
          {selectedSub.minHouseholdSize && (
            <TextField
              label="גודל משק בית"
              type="number"
              value={state.householdSize}
              onChange={(e) =>
                dispatch({ type: 'UPDATE_FIELD', field: 'householdSize', value: Number(e.target.value) })
              }
              fullWidth
              sx={{ mb: 2 }}
            />
          )}
          {selectedSub.minChildren && (
            <TextField
              label="מספר ילדים"
              type="number"
              value={state.childrenCount}
              onChange={(e) =>
                dispatch({ type: 'UPDATE_FIELD', field: 'childrenCount', value: Number(e.target.value) })
              }
              fullWidth
            />
          )}
        </Paper>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
        <Button variant="outlined" onClick={() => dispatch({ type: 'PREV_STEP' })}>
          חזרה
        </Button>
        <Button variant="contained" onClick={() => dispatch({ type: 'NEXT_STEP' })}>
          {state.selectedExemption ? 'הבא' : 'דלג'}
        </Button>
      </Box>
    </Box>
  );
}
