import { Link } from "react-router-dom";
import { MarketingPage } from "@/components/layout/MarketingPage";
import { enterpriseHighlights } from "@/data/siteData";

export default function Enterprise() {
  return (
    <MarketingPage
      title="Enterprise Lost & Found Operations"
      subtitle="Scale asset recovery with bulk QR generation, analytics, and admin controls."
      actions={
        <>
          <Link to="/contact" className="btn btn-primary">Book a Demo</Link>
          <Link to="/pricing" className="btn btn-outline">See Plans</Link>
        </>
      }
    >
      <section className="page-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Built for Teams and Fleets</h2>
            <p className="section-subtitle">Launch a modern lost-and-found workflow across departments, campuses, or device fleets.</p>
          </div>
          <div className="feature-grid-2">
            {enterpriseHighlights.map((highlight) => (
              <div key={highlight.title} className="page-card">
                <h3>{highlight.title}</h3>
                <p>{highlight.description}</p>
              </div>
            ))}
          </div>
          <div className="page-callout">
            <div>
              <h3>Need bulk sticker fulfillment?</h3>
              <p>We support custom templates, white-label QR domains, and team onboarding flows.</p>
            </div>
            <Link to="/contact" className="btn btn-primary">Contact Enterprise Sales</Link>
          </div>
        </div>
      </section>
    </MarketingPage>
  );
}
