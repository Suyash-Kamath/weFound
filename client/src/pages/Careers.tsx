import { MarketingPage } from "@/components/layout/MarketingPage";

export default function Careers() {
  return (
    <MarketingPage
      title="Careers"
      subtitle="Help us build the most trusted recovery platform for lost items."
    >
      <section className="page-section">
        <div className="container">
          <div className="page-card">
            <h3>We're Hiring Soon</h3>
            <p>Roles for product, engineering, and operations will open as we scale.</p>
          </div>
        </div>
      </section>
    </MarketingPage>
  );
}
