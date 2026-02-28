import { motion } from "framer-motion";
import { pricingTiers } from "@/data/siteData";
import { Check } from "lucide-react";
import { Link } from "react-router-dom";

export function PricingSection() {
  return (
    <section className="pricing-section">
      <div className="container">
        <motion.div
          className="section-header"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="section-title">
            Pricing That Scales with <span className="text-gradient">Your Items</span>
          </h2>
          <p className="section-subtitle">
            Start small or go enterprise. Every tier includes dynamic QR management and finder pages.
          </p>
        </motion.div>

        <div className="pricing-grid">
          {pricingTiers.map((tier, index) => (
            <motion.div
              key={tier.name}
              className={`pricing-card ${tier.highlight ? "highlight" : ""}`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              {tier.highlight && <div className="pricing-badge">Most Popular</div>}
              <h3>{tier.name}</h3>
              <p className="pricing-subtitle">{tier.subtitle}</p>
              <div className="pricing-price">{tier.price}</div>
              <p className="pricing-desc">{tier.description}</p>
              <ul className="pricing-features">
                {tier.features.map((feature) => (
                  <li key={feature}>
                    <Check size={16} />
                    {feature}
                  </li>
                ))}
              </ul>
              <Link to="/pricing" className="btn btn-outline pricing-cta">
                {tier.price === "Custom" ? "Talk to Sales" : "Choose Plan"}
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
