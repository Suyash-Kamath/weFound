import { MarketingPage } from "@/components/layout/MarketingPage";

export default function Blog() {
  return (
    <MarketingPage
      title="Lost & Found Insights"
      subtitle="Updates, recovery stories, and product announcements."
    >
      <section className="page-section">
        <div className="container">
          <div className="page-card">
            <h3>Coming Soon</h3>
            <p>We are preparing our first stories and product updates. Check back soon.</p>
          </div>
        </div>
      </section>
    </MarketingPage>
  );
}
