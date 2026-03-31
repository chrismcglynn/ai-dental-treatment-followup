import { HeroSection } from "@/components/marketing/HeroSection";
import { ProblemSection } from "@/components/marketing/ProblemSection";
import { SolutionSection } from "@/components/marketing/SolutionSection";
import { RevenueCalculator } from "@/components/marketing/RevenueCalculator";
import { HowItWorksSection } from "@/components/marketing/HowItWorksSection";
import { PmsIntegrationsSection } from "@/components/marketing/PmsIntegrationsSection";
import { ComplianceSection } from "@/components/marketing/ComplianceSection";
import { TestimonialSection } from "@/components/marketing/TestimonialSection";
import { PricingSection } from "@/components/marketing/PricingSection";
import { FinalCtaSection } from "@/components/marketing/FinalCtaSection";

export default function LandingPage() {
  return (
    <>
      <HeroSection />
      <ProblemSection />
      <SolutionSection />
      <RevenueCalculator />
      <HowItWorksSection />
      <PmsIntegrationsSection />
      <ComplianceSection />
      <TestimonialSection />
      <PricingSection />
      <FinalCtaSection />
    </>
  );
}
