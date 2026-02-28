import { Link } from "react-router-dom";
import { MarketingPage } from "@/components/layout/MarketingPage";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { LifecycleSection } from "@/components/landing/LifecycleSection";
import { RolesSection } from "@/components/landing/RolesSection";
import { CTASection } from "@/components/landing/CTASection";

export default function HowItWorks() {
  return (
    <MarketingPage
      title="How weFound Works"
      subtitle="From sticker activation to item recovery, every step is designed to be fast and privacy-safe."
      actions={
        <>
          <Link to="/auth?mode=register" className="btn btn-primary">Activate a Sticker</Link>
          <Link to="/pricing" className="btn btn-outline">View Pricing</Link>
        </>
      }
    >
      <LifecycleSection />
      <HowItWorksSection />
      <RolesSection />
      <CTASection />
    </MarketingPage>
  );
}
