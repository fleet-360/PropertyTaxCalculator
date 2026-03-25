import Navbar from '@/components/landing/Navbar';
import HeroSection from '@/components/landing/HeroSection';
import StatsBar from '@/components/landing/StatsBar';
import FormulasStrip from '@/components/landing/FormulasStrip';
import HowItWorksSection from '@/components/landing/HowItWorksSection';
import CalculatorCTA from '@/components/landing/CalculatorCTA';
import TestimonialsSection from '@/components/landing/TestimonialsSection';
import Footer from '@/components/landing/Footer';
import { loadCalculatorFeatureConfig } from '@/lib/loadCalculatorFeatureConfig';

export default async function HomePage() {
  const calculatorFeatures = await loadCalculatorFeatureConfig();

  return (
    <>
      <Navbar />
      <main id="main-content" style={{ overflowX: 'hidden' }}>
        <HeroSection />
        <FormulasStrip />
        <StatsBar />
        <HowItWorksSection />
        <CalculatorCTA featureConfig={calculatorFeatures} />
        <TestimonialsSection />
      </main>
      <Footer />
    </>
  );
}
