import { CtaSection } from "@/components/marketing/cta-section";
import { FaqSection } from "@/components/marketing/faq-section";
import { HeroSection } from "@/components/marketing/hero-section";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { PainSection } from "@/components/marketing/pain-section";
import { PricingSection } from "@/components/marketing/pricing-section";
import { SolutionSection } from "@/components/marketing/solution-section";
import { TestimonialsSection } from "@/components/marketing/testimonials-section";
import { TrustBar } from "@/components/marketing/trust-bar";
import { VerticalsSection } from "@/components/marketing/verticals-section";

export default function LandingPage() {
  return (
    <>
      <HeroSection />
      <TrustBar />
      <PainSection />
      <SolutionSection />
      <HowItWorks />
      <VerticalsSection />
      <PricingSection />
      <TestimonialsSection />
      <FaqSection />
      <CtaSection />
    </>
  );
}
