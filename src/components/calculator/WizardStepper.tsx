'use client';

import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import Box from '@mui/material/Box';

const STEPS = ['התחלה', 'פרטי נכס', 'הנחות', 'הצהרה', 'תוצאות'];

/** Map wizard internal step index to stepper active index (0..STEPS.length-1). */
function internalStepToDisplayStep(internal: number): number {
  if (internal <= 1) return 0;
  if (internal === 2) return 1;
  if (internal === 3) return 2;
  if (internal === 4) return 3;
  return 4;
}

interface WizardStepperProps {
  currentStep: number;
}

export default function WizardStepper({ currentStep }: WizardStepperProps) {
  const displayStep = internalStepToDisplayStep(currentStep);

  return (
    <Box sx={{ mb: 4 }}>
      <Stepper activeStep={displayStep} alternativeLabel>
        {STEPS.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>
    </Box>
  );
}
