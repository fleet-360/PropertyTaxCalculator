'use client';

import CalculatorWizard from '@/components/calculator/CalculatorWizard';
import type { CalculatorFeatureConfig } from '@/lib/types/system-config';

export default function CalculatorPageClient({ features }: { features: CalculatorFeatureConfig }) {
  return <CalculatorWizard features={features} />;
}
