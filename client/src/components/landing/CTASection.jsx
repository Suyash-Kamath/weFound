import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

export function CTASection() {
  return (
    <section className="cta-section">
      <div className="cta-bg" />

      <div className="container">
        <motion.div 
          className="cta-inner" 
          initial={{ opacity: 0, y: 20 }} 
          whileInView={{ opacity: 1, y: 0 }} 
          viewport={{ once: true }} 
          transition={{ duration: 0.5 }}
        >
          <div className="cta-badge">
            <Sparkles size={16} /> 
            <span>Start Protecting Today</span>
          </div>

          <h2 className="cta-title">
            Ready to Never Lose<br />
            <span className="text-gradient">Your Valuables Again?</span>
          </h2>

          <p className="cta-lead">
            Launch a smarter lost-and-found system with dynamic QR stickers and privacy-first recovery flows. Start free and scale as you grow.
          </p>

          <div className="cta-actions">
            <Link to="/auth?mode=register" className="btn btn-primary">Create Free Account</Link>
            <Link to="/dashboard" className="btn btn-outline">View Demo Dashboard</Link>
          </div>

          <p className="cta-note">No credit card required • Dynamic QR stickers included • Cancel anytime</p>
        </motion.div>
      </div>
    </section>
  );
}
