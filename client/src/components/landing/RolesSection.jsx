import { motion } from "framer-motion";
import { roleCards } from "@/data/siteData";
import { Users, ShieldCheck, Building2 } from "lucide-react";

const icons = [Users, ShieldCheck, Building2];

export function RolesSection() {
  return (
    <section className="roles-section">
      <div className="container">
        <motion.div
          className="section-header"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="section-title">Designed for Everyone in the Return Loop</h2>
          <p className="section-subtitle">
            Individuals, good Samaritans, and enterprise teams all get the right tools in one platform.
          </p>
        </motion.div>

        <div className="roles-grid">
          {roleCards.map((role, index) => {
            const Icon = icons[index];
            return (
              <motion.div
                key={role.title}
                className="role-card"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.12 }}
              >
                <div className="role-icon">
                  <Icon size={24} />
                </div>
                <h3>{role.title}</h3>
                <p>{role.description}</p>
                <ul>
                  {role.points.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
