import { motion } from "framer-motion";
import { QrCode, ScanLine, Truck, Sparkles } from "lucide-react";

const lifecycle = [
  {
    icon: QrCode,
    title: "Activate Your Sticker",
    description: "Claim a sticker, map it to an item, and choose what details are visible to finders.",
  },
  {
    icon: ScanLine,
    title: "Finder Scans the QR",
    description: "The scan opens a secure page with your item info and approved contact options.",
  },
  {
    icon: Truck,
    title: "Recover or Ship",
    description: "Chat, arrange pickup, or trigger a courier return with owner-paid delivery.",
  },
];

export function LifecycleSection() {
  return (
    <section className="lifecycle-section">
      <div className="container">
        <motion.div
          className="section-header"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div className="section-kicker">
            <Sparkles size={16} />
            <span>End-to-End Recovery</span>
          </div>
          <h2 className="section-title">
            Lost-and-Found, <span className="text-gradient">Reimagined</span>
          </h2>
          <p className="section-subtitle">
            Every scan starts a guided recovery workflow with privacy, proof, and delivery support built in.
          </p>
        </motion.div>

        <div className="lifecycle-grid">
          {lifecycle.map((step, index) => (
            <motion.div
              key={step.title}
              className="lifecycle-card"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <div className="lifecycle-icon">
                <step.icon size={26} />
              </div>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
