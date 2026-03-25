import CalculatorUnavailableMessage from '@/components/calculator/CalculatorUnavailableMessage';
import CalculatorPageClient from '@/components/calculator/CalculatorPageClient';
import { loadCalculatorFeatureConfig } from '@/lib/loadCalculatorFeatureConfig';

export default async function CalculatorPage() {
  const features = await loadCalculatorFeatureConfig();

  if (!features.systemEnabled) {
    return <CalculatorUnavailableMessage />;
  }

  return <CalculatorPageClient features={features} />;
}
