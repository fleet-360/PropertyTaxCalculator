import Navbar from '@/components/landing/Navbar';
import HeroSection from '@/components/landing/HeroSection';
import StatsBar from '@/components/landing/StatsBar';
import FormulasStrip from '@/components/landing/FormulasStrip';
import CalculatorCTA from '@/components/landing/CalculatorCTA';
import TestimonialsSection from '@/components/landing/TestimonialsSection';
import Footer from '@/components/landing/Footer';

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        <HeroSection />
        <FormulasStrip />
        <StatsBar />
        <CalculatorCTA />
        <TestimonialsSection />
      </main>
      <Footer />
    </>
  );
}
