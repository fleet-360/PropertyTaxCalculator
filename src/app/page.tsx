export const revalidate = 300;

import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import StatsBar from "@/components/landing/StatsBar";
import FormulasStrip from "@/components/landing/FormulasStrip";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import CalculatorCTA from "@/components/landing/CalculatorCTA";
import TestimonialsSection from "@/components/landing/TestimonialsSection";
import Footer from "@/components/landing/Footer";
import LazySection from "@/components/common/LazySection";
import { loadCalculatorFeatureConfig } from "@/lib/loadCalculatorFeatureConfig";

export default async function HomePage() {
  const calculatorFeatures = await loadCalculatorFeatureConfig();

  return (
    <>
      <Navbar />
      <main id="main-content" style={{ overflowX: "hidden" }}>
        <HeroSection />
        <FormulasStrip />
        <LazySection minHeight={300}>
          <StatsBar />
        </LazySection>
        <LazySection minHeight={600}>
          <HowItWorksSection />
        </LazySection>
        <CalculatorCTA featureConfig={calculatorFeatures} />
        <LazySection minHeight={500}>
          <TestimonialsSection />
        </LazySection>
      </main>
      <Footer />
    </>
  );
}
