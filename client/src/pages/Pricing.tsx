import { Link } from "react-router-dom";
import { MarketingPage } from "@/components/layout/MarketingPage";
import { PricingSection } from "@/components/landing/PricingSection";
import { faqs } from "@/data/siteData";

export default function Pricing() {
  return (
    <MarketingPage
      title="Simple, Transparent Pricing"
      subtitle="Launch with a starter kit or scale across teams with enterprise tools."
      actions={
        <>
          <Link to="/auth?mode=register" className="btn btn-primary">Start Free</Link>
          <Link to="/contact" className="btn btn-outline">Talk to Sales</Link>
        </>
      }
    >
      <PricingSection />

      <section className="page-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Frequently Asked Questions</h2>
            <p className="section-subtitle">Everything you need to know about sticker packs, recovery flows, and privacy.</p>
          </div>
          <div className="faq-grid">
            {faqs.map((faq) => (
              <div key={faq.question} className="faq-card">
                <h3>{faq.question}</h3>
                <p>{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </MarketingPage>
  );
}
