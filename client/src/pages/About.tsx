import { MarketingPage } from "@/components/layout/MarketingPage";

export default function About() {
  return (
    <MarketingPage
      title="About weFound"
      subtitle="We help people and organizations reunite with what matters, without giving up privacy."
    >
      <section className="page-section">
        <div className="container">
          <div className="page-card">
            <h3>Our Mission</h3>
            <p>
              weFound turns everyday items into recoverable assets. By combining dynamic QR stickers with
              privacy-first communication and delivery workflows, we make it easy to return lost items without
              exposing personal data.
            </p>
          </div>
          <div className="page-card">
            <h3>What We Build</h3>
            <p>
              A unified platform for individuals, businesses, and institutions that need scalable item recovery.
              From single backpacks to enterprise device fleets, every sticker connects to a secure recovery flow.
            </p>
          </div>
        </div>
      </section>
    </MarketingPage>
  );
}
