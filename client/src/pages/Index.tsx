import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { HeroSection } from "@/components/landing/HeroSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { CTASection } from "@/components/landing/CTASection";
import { LifecycleSection } from "@/components/landing/LifecycleSection";
import { RolesSection } from "@/components/landing/RolesSection";
import { PricingSection } from "@/components/landing/PricingSection";
import { TechSection } from "@/components/landing/TechSection";

const Index = () => {
  return (
    <div className="page-wrapper">
      <Navbar />
      <main className="main-content">
        <HeroSection />
        <FeaturesSection />
        <LifecycleSection />
        <HowItWorksSection />
        <RolesSection />
        <TechSection />
        <PricingSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
