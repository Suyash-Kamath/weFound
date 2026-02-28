export const pricingTiers = [
  {
    name: "Starter",
    price: "$9",
    subtitle: "Best for individuals",
    description: "Protect up to 5 items with dynamic QR profiles.",
    highlight: false,
    features: [
      "5 dynamic QR stickers",
      "Privacy controls",
      "Finder landing pages",
      "Email + WhatsApp contact",
      "Basic scan history",
    ],
  },
  {
    name: "Plus",
    price: "$19",
    subtitle: "Most popular",
    description: "Flexible recovery workflows and delivery support.",
    highlight: true,
    features: [
      "15 dynamic QR stickers",
      "In-app messaging",
      "Delivery handoff flow",
      "Scan alerts",
      "Tip recommendations",
      "Item photos",
    ],
  },
  {
    name: "Business",
    price: "Custom",
    subtitle: "Teams & fleets",
    description: "Bulk QR generation, admin controls, and exportable analytics.",
    highlight: false,
    features: [
      "Bulk CSV import",
      "Admin dashboard",
      "Advanced analytics",
      "White-label QR domain",
      "Priority support",
    ],
  },
];

export const faqs = [
  {
    question: "Do I need a new sticker if I change items?",
    answer:
      "No. Each sticker is dynamic, so you can remap it to another item anytime from your dashboard.",
  },
  {
    question: "What does a finder see when they scan?",
    answer:
      "Only what you allow: item details, return instructions, and your chosen contact options or in-app chat.",
  },
  {
    question: "How do deliveries work if I cannot pick up?",
    answer:
      "The finder can start a courier return flow and you pay for shipping via the linked checkout or COD.",
  },
  {
    question: "Do you share my phone or address?",
    answer:
      "Not unless you enable it. Privacy controls let you hide personal data and use in-app messaging instead.",
  },
  {
    question: "Can businesses order in bulk?",
    answer:
      "Yes. Upload a CSV, generate unique QR codes, and manage assets in a centralized dashboard.",
  },
];

export const enterpriseHighlights = [
  {
    title: "Bulk QR Generation",
    description: "Upload spreadsheets to auto-create thousands of item profiles with unique QR codes.",
  },
  {
    title: "Asset Visibility",
    description: "Track scan locations and recovery outcomes across departments and locations.",
  },
  {
    title: "Custom Branding",
    description: "Use your own domain, sticker designs, and brand colors for finder pages.",
  },
  {
    title: "Security & Compliance",
    description: "Granular privacy controls, consent-based location capture, and audit trails.",
  },
];

export const roleCards = [
  {
    title: "Owners",
    description: "Tag valuables, set contact rules, and get instant scan alerts.",
    points: ["Dynamic QR mapping", "Delivery handoff", "Tip recommendations"],
  },
  {
    title: "Finders",
    description: "Scan, message securely, and arrange pickup or courier returns.",
    points: ["One-tap contact", "Privacy-safe chat", "Optional rewards"],
  },
  {
    title: "Businesses",
    description: "Manage fleets and assets at scale with bulk tooling.",
    points: ["CSV imports", "Team roles", "Exportable analytics"],
  },
];
