'use client';

import { useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Button from '@mui/material/Button';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import type { StepProps } from '../CalculatorWizard';
import { useLeadUpdate } from '@/hooks/useLeadUpdate';
import { CONSENT_TEXTS } from '@/lib/consent/consentTexts';
import { useConsentSubmit } from '@/hooks/useConsentSubmit';

/** Mia messages seeded in `seed-mia-messages.ts` — merged into one bubble on the disclaimer step. */
const DISCLAIMER_MIA_MESSAGE_IDS = ['step-4-note-accuracy', 'step-4-note-ordinance'] as const;

const DISCLAIMER_TEXT = CONSENT_TEXTS.legal_disclaimer.text;

export default function DisclaimerStep({ state, dispatch, sx }: StepProps) {
  const { updateLead } = useLeadUpdate();
  const { submitConsent } = useConsentSubmit();

  useEffect(() => {
    dispatch({
      type: 'SET_MIA_MESSAGE',
      payload: [...DISCLAIMER_MIA_MESSAGE_IDS],
    });
  }, [dispatch]);

  return (
    <Box sx={sx}>
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2.25, md: 3 },
          mb: 3,
          maxHeight: 320,
          overflowY: 'auto',
          lineHeight: 1.8,
          borderRadius: 2,
          border: '1px solid #e3e7f1',
          bgcolor: '#fff',
        }}
      >
        <Typography variant="body2" sx={{ color: '#333' }}>
          {DISCLAIMER_TEXT}
        </Typography>
      </Paper>

      <FormControlLabel
        control={
          <Checkbox
            checked={state.consentGiven}
            onChange={(e) =>
              dispatch({ type: 'UPDATE_FIELD', field: 'consentGiven', value: e.target.checked })
            }
            sx={(theme) => ({
              color: '#cdd2e0',
              '&.Mui-checked': { color: theme.palette.brand.blue },
            })}
          />
        }
        label={
          <Typography
            sx={(theme) => ({
              fontSize: '14px',
              fontWeight: 600,
              color: theme.palette.brand.navyDeep,
            })}
          >
            קראתי את התקנון ומדיניות הפרטיות ואני מסכים/ה ומאשר/ת
          </Typography>
        }
      />

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4, gap: 2, flexWrap: 'wrap' }}>
        <Button
          variant="outlined"
          onClick={() => dispatch({ type: 'PREV_STEP' })}
          startIcon={<ChevronRightIcon />}
          sx={(theme) => ({
            borderRadius: '999px',
            px: 3.5,
            py: 1.5,
            fontSize: '15px',
            fontWeight: 600,
            borderColor: '#cdd2e0',
            color: theme.palette.brand.navyDeep,
            '& .MuiButton-startIcon': { mr: 0.5, ml: -0.5 },
            '&:hover': {
              borderColor: theme.palette.brand.blue,
              bgcolor: 'rgba(26,86,224,0.04)',
            },
          })}
        >
          חזרה
        </Button>
        <Button
          variant="contained"
          disabled={!state.consentGiven}
          endIcon={<ChevronLeftIcon />}
          sx={(theme) => ({
            bgcolor: theme.palette.brand.blue,
            color: '#fff',
            borderRadius: '999px',
            px: 4,
            py: 1.5,
            fontSize: '16px',
            fontWeight: 700,
            boxShadow: `0 10px 24px ${theme.palette.brand.blue}40`,
            '& .MuiButton-endIcon': { ml: 0.75, mr: -0.5 },
            '&:hover': {
              bgcolor: theme.palette.brand.blueDark,
            },
            '&.Mui-disabled': {
              bgcolor: '#cdd2e0',
              color: '#fff',
            },
          })}
          onClick={() => {
            submitConsent(state.leadId, state.phone, 'legal_disclaimer', true);
            updateLead(state.leadId, state.calculationIndex, {
              abandonmentStage: 'disclaimer',
            });
            dispatch({ type: 'SET_LOADING', payload: true });
            if (state.designations.length > 1) {
              dispatch({ type: 'SET_LOADING', payload: false });
              dispatch({ type: 'SET_CONTACT_REDIRECT', payload: 'designations' });
              return;
            }
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
                designations:
                  state.propertyType === 'business'
                    ? state.designations.map((d) => ({
                        typeCode: d.type,
                        subtypeCode: d.subtype,
                        zone: d.zone,
                        areaSqm: d.area,
                      }))
                    : undefined,
                additionalAreas: state.additionalAreas.length > 0 ? state.additionalAreas : undefined,
                selectedFees: state.selectedFees.length > 0 ? state.selectedFees : undefined,
              }),
            })
              .then((r) => {
                if (!r.ok) throw new Error(`HTTP ${r.status}`);
                return r.json();
              })
              .then((data) => {
                dispatch({ type: 'SET_CALCULATION_RESULT', payload: data });
                dispatch({ type: 'SET_LOADING', payload: false });
                // Save calculation result to lead
                updateLead(state.leadId, state.calculationIndex, {
                  abandonmentStage: 'results_gate',
                  calculationResult: data,
                  calculationStatus: data.outcome,
                });
                dispatch({ type: 'NEXT_STEP' });
              })
              .catch(() => {
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

