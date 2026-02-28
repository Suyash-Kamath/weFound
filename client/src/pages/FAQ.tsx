import { MarketingPage } from "@/components/layout/MarketingPage";
import { faqs } from "@/data/siteData";

export default function FAQ() {
  return (
    <MarketingPage
      title="Frequently Asked Questions"
      subtitle="Quick answers about stickers, privacy, and recovery workflows."
    >
      <section className="page-section">
        <div className="container">
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
