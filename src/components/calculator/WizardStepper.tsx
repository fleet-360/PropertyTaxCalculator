'use client';

import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import Box from '@mui/material/Box';

const STEPS = [
  'התחלה',
  'פרטי נכס',
  'הנחות',
  'הצהרה',
  'תוצאות',
];

interface WizardStepperProps {
  currentStep: number;
}

export default function WizardStepper({ currentStep }: WizardStepperProps) {
  // Map internal step index (0-9) to stepper display index (0-7)
  const displayStep = Math.min(currentStep, STEPS.length - 1);

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
