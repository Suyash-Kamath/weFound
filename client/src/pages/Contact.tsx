import { MarketingPage } from "@/components/layout/MarketingPage";

export default function Contact() {
  return (
    <MarketingPage
      title="Contact Us"
      subtitle="Tell us about your recovery needs and we will respond within one business day."
    >
      <section className="page-section">
        <div className="container">
          <div className="contact-grid">
            <div className="page-card">
              <h3>Reach the Team</h3>
              <p>Email: support@wefound.com</p>
              <p>Phone: +91 99999 99999</p>
              <p>Location: Mumbai, India</p>
            </div>
            <div className="page-card">
              <h3>Send a Message</h3>
              <form className="contact-form">
                <div className="form-group">
                  <label className="form-label" htmlFor="contact-name">Name</label>
                  <input id="contact-name" className="form-input" placeholder="Your name" />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="contact-email">Email</label>
                  <input id="contact-email" type="email" className="form-input" placeholder="you@example.com" />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="contact-message">Message</label>
                  <textarea id="contact-message" className="form-input" rows={4} placeholder="Tell us what you need" />
                </div>
                <button type="button" className="btn btn-primary">Send Message</button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </MarketingPage>
  );
}
