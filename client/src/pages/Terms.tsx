import { MarketingPage } from "@/components/layout/MarketingPage";

export default function Terms() {
  return (
    <MarketingPage
      title="Terms of Service"
      subtitle="Clear expectations for owners, finders, and enterprise customers."
    >
      <section className="page-section">
        <div className="container">
          <div className="page-card">
            <h3>Usage Terms</h3>
            <p>
              weFound provides tools to facilitate returns but does not take custody of items. Owners are
              responsible for verifying ownership and coordinating returns safely.
            </p>
            <p>
              This is a placeholder terms section for the prototype. Replace with your legal terms before launch.
            </p>
          </div>
        </div>
      </section>
    </MarketingPage>
  );
}
