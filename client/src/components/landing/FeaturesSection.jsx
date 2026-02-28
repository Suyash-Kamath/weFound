import { motion } from "framer-motion";
import { 
  QrCode, 
  Shield, 
  MessageSquare, 
  Truck, 
  BarChart3, 
  Smartphone,
  Clock,
  Globe
} from "lucide-react";

const features = [
  {
    icon: QrCode,
    title: "Dynamic QR Codes",
    description: "One sticker, unlimited possibilities. Change which item it's linked to anytime without needing a new sticker.",
    colorClass: "icon-primary",
  },
  {
    icon: Shield,
    title: "Privacy First",
    description: "Control exactly what contact info finders can see. Keep your personal details hidden while staying reachable.",
    colorClass: "icon-green",
  },
  {
    icon: MessageSquare,
    title: "Secure Messaging",
    description: "Built-in chat system lets finders contact you without exposing your phone number or email.",
    colorClass: "icon-blue",
  },
  {
    icon: Truck,
    title: "Easy Delivery",
    description: "Can't pick up your item? Arrange secure courier pickup with our integrated Shiprocket service.",
    colorClass: "icon-orange",
  },
  {
    icon: BarChart3,
    title: "Scan Analytics",
    description: "Track every scan with detailed info including time, location, and device. Know your item's journey.",
    colorClass: "icon-purple",
  },
  {
    icon: Smartphone,
    title: "Mobile Optimized",
    description: "Beautiful finder experience on any device. Finders can reach you in seconds with just a tap.",
    colorClass: "icon-pink",
  },
  {
    icon: Clock,
    title: "Instant Notifications",
    description: "Get alerted the moment someone scans your QR. Never miss a chance to recover your item.",
    colorClass: "icon-cyan",
  },
  {
    icon: Globe,
    title: "Works Worldwide",
    description: "Whether you lose something locally or abroad, our system works anywhere in the world.",
    colorClass: "icon-amber",
  },
];

export function FeaturesSection() {
  return (
    <section className="features-section">
      <div className="container">
        <motion.div 
          className="section-header"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="section-title">Everything You Need to<br /><span className="text-gradient">Protect Your Belongings</span></h2>
          <p className="section-subtitle">Our comprehensive platform makes it easy to tag, track, and recover your valuables.</p>
        </motion.div>

        <div className="features-grid">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              className="feature-card"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <div className={`feature-icon-box ${feature.colorClass}`}>
                <feature.icon size={24} />
              </div>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-desc">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}