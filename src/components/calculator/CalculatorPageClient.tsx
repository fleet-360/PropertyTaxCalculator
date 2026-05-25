'use client';

import Box from '@mui/material/Box';
import CalculatorWizard from '@/components/calculator/CalculatorWizard';
import type { CalculatorFeatureConfig } from '@/lib/types/system-config';

export default function CalculatorPageClient({ features }: { features: CalculatorFeatureConfig }) {
  return (
    <Box sx={{ bgcolor: '#FFFFFF', flex: 1 }}>
      <CalculatorWizard features={features} />
    </Box>
  );
}
