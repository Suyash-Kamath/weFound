import { motion } from "framer-motion";
import { Package, QrCode, ScanLine, MessageCircle } from "lucide-react";

const steps = [
  {
    step: "01",
    icon: Package,
    title: "Get Your Stickers",
    description: "Order our premium QR stickers. Each one comes with a unique, dynamic code ready to be activated.",
  },
  {
    step: "02",
    icon: QrCode,
    title: "Link to Your Items",
    description: "Scan or enter the sticker code to link it to any item. Add photos, description, and set your contact preferences.",
  },
  {
    step: "03",
    icon: ScanLine,
    title: "Someone Finds It",
    description: "When a finder scans the QR, they see a landing page with your item details and approved contact options.",
  },
  {
    step: "04",
    icon: MessageCircle,
    title: "Get Reunited",
    description: "Chat securely, arrange pickup or delivery, and get your item back. Optionally tip your helper!",
  },
];

export function HowItWorksSection() {
  return (
    <section className="how-section">
      <div className="container">
        <motion.div 
          className="section-header"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="section-title">How It <span className="text-gradient">Works</span></h2>
          <p className="section-subtitle">Four simple steps to protect your valuables and recover them when lost.</p>
        </motion.div>

        <div className="how-grid">
          {steps.map((step, index) => (
            <motion.div
              key={step.step}
              className="how-step"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
            >
              <div className="how-icon-wrapper">
                <step.icon size={32} />
                <div className="how-step-number">{step.step}</div>
              </div>

              <h3 className="how-step-title">{step.title}</h3>
              <p className="how-step-desc">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}