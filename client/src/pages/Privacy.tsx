import { MarketingPage } from "@/components/layout/MarketingPage";

export default function Privacy() {
  return (
    <MarketingPage
      title="Privacy Policy"
      subtitle="Your data stays under your control. We collect only what we need to enable recovery."
    >
      <section className="page-section">
        <div className="container">
          <div className="page-card">
            <h3>Privacy Principles</h3>
            <p>
              We keep finder data minimal, require consent for precise location, and never share personal details
              unless you explicitly enable them. Contact data can always be routed through in-app messaging.
            </p>
            <p>
              This is a placeholder policy for the prototype. Replace with your legal policy before launch.
            </p>
          </div>
        </div>
      </section>
    </MarketingPage>
  );
}
