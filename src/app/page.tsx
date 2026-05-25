export const revalidate = 300;

import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import IntroAndCitiesSection from "@/components/landing/IntroAndCitiesSection";
import StatsBar from "@/components/landing/StatsBar";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import FaqSection from "@/components/landing/FaqSection";
import TestimonialsSection from "@/components/landing/TestimonialsSection";
import Footer from "@/components/landing/Footer";

export default async function HomePage() {
  return (
    <>
      <Navbar />
      <main id="main-content" style={{ overflowX: "hidden" }}>
        <HeroSection />
        <IntroAndCitiesSection />
        <StatsBar />
        <HowItWorksSection />
        <FaqSection />
        <TestimonialsSection />
      </main>
      <Footer />
    </>
  );
}
