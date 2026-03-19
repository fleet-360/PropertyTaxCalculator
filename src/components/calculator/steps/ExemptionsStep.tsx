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
import { IExemptionRestrictions } from '@/lib/models/CityTariff';

interface ExemptionSubsection {
  code: string;
  label: string;
  description?: string;
  discountPercent: number;
  restrictions: IExemptionRestrictions;
}

interface ExemptionSection {
  sectionLabel: string;
  subSections: ExemptionSubsection[];
}

export default function ExemptionsStep({ state, dispatch }: StepProps) {
  const exemptionSections: ExemptionSection[] = state.cityData?.exemptions ?? [];

  const handleExemptionChange = (value: string) => {
    dispatch({ type: 'UPDATE_FIELD', field: 'selectedExemption', value });
  };

  // Find the currently selected subsection to check restrictions
  const selectedSub = exemptionSections
    .flatMap((s) => s?.subSections)
    .find((sub) => sub?.code === state.selectedExemption) ?? {} as ExemptionSubsection;


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

      {exemptionSections?.map((section) => (
        <Paper key={section.sectionLabel} sx={{ p: 2, mb: 2 }} variant="outlined">
          <Typography variant="subtitle1" fontWeight={600} mb={1}>
            {section.sectionLabel}
          </Typography>
          <RadioGroup value={state.selectedExemption} onChange={(e) => handleExemptionChange(e.target.value)}>
            {section?.subSections?.map((sub) => (
              <FormControlLabel
                key={sub.code}
                value={sub.code}
                control={<Radio />}
                label={
                  <Box>
                    <Typography variant="body2">
                      {sub.description} — {sub.discountPercent}% הנחה
                    </Typography>
                    {/* {sub.description && (
                      <Typography variant="caption" color="text.secondary">
                        {sub.description}
                      </Typography>
                    )} */}
                  </Box>
                }
              />
            ))}
          </RadioGroup>
        </Paper>
      ))}

      {/* Restriction inputs */}
      {selectedSub && (selectedSub?.restrictions?.minHouseholdSize || selectedSub?.restrictions?.minChildren) && (
        <Paper sx={{ p: 2, mb: 2 }} variant="outlined">
          {selectedSub?.restrictions?.minHouseholdSize && (
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
          {selectedSub?.restrictions?.minChildren && (
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
