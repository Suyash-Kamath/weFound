import { motion } from "framer-motion";
import { ShieldCheck, MapPin, MessagesSquare, LineChart } from "lucide-react";

const blocks = [
  {
    icon: ShieldCheck,
    title: "Privacy Controls",
    description: "Granular visibility toggles, masked contacts, and consent-based location sharing.",
  },
  {
    icon: MessagesSquare,
    title: "In-App Communication",
    description: "Finder-to-owner chat and call proxy keep personal details protected.",
  },
  {
    icon: MapPin,
    title: "Location Intelligence",
    description: "Scan heatmaps, journey timelines, and geofence alerts for owners and admins.",
  },
  {
    icon: LineChart,
    title: "Actionable Analytics",
    description: "Track recovery rates, scan velocity, and suspicious activity patterns.",
  },
];

export function TechSection() {
  return (
    <section className="tech-section">
      <div className="container">
        <motion.div
          className="section-header"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="section-title">Built for Trust, Visibility, and Scale</h2>
          <p className="section-subtitle">
            weFound combines privacy-first workflows with operational tooling for recovery at any scale.
          </p>
        </motion.div>

        <div className="tech-grid">
          {blocks.map((block, index) => (
            <motion.div
              key={block.title}
              className="tech-card"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <div className="tech-icon">
                <block.icon size={22} />
              </div>
              <h3>{block.title}</h3>
              <p>{block.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
