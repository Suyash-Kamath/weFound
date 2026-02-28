import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Navbar } from "@/components/layout/Navbar";
import { useItemStore } from "@/stores/itemStore";
import { ITEM_CATEGORIES, ContactOptions } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save, Package } from "lucide-react";

export default function EditItem() {
  const { id } = useParams<{ id: string }>();
  const { items, updateItem } = useItemStore();
  const navigate = useNavigate();
  const { toast } = useToast();

  const item = items.find((entry) => entry.id === id);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [estimatedValue, setEstimatedValue] = useState("");
  const [returnInstructions, setReturnInstructions] = useState("");
  const [contactOptions, setContactOptions] = useState<ContactOptions>({
    showWhatsApp: true,
    showCall: true,
    showSms: false,
    showEmail: true,
    showInAppChat: true,
    whatsAppNumber: "",
    phoneNumber: "",
    email: "",
  });

  useEffect(() => {
    if (!item) return;
    setName(item.name);
    setDescription(item.description || "");
    setCategory(item.category);
    setEstimatedValue(item.estimatedValue ? String(item.estimatedValue) : "");
    setReturnInstructions(item.returnInstructions || "");
    setContactOptions(item.contactOptions);
  }, [item]);

  if (!item) {
    return (
      <div className="dashboard-layout">
        <Navbar />
        <main className="dashboard-main">
          <div className="container">
            <div className="page-card">
              <h3>Item Not Found</h3>
              <p>The item you tried to edit does not exist.</p>
              <Link to="/dashboard" className="btn btn-primary" style={{ marginTop: "1rem" }}>
                Back to Dashboard
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    await updateItem(item.id, {
      name,
      description,
      category,
      estimatedValue: estimatedValue ? parseFloat(estimatedValue) : undefined,
      returnInstructions,
      contactOptions,
    });

    toast({
      title: "Item updated",
      description: "Your item details were saved.",
    });

    navigate("/dashboard");
  };

  return (
    <div className="dashboard-layout">
      <Navbar />
      <main className="dashboard-main">
        <div className="container" style={{ maxWidth: "800px" }}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Link
              to="/dashboard"
              className="btn btn-outline"
              style={{ display: "inline-flex", alignItems: "center", gap: "8px", marginBottom: "1.5rem" }}
            >
              <ArrowLeft size={16} /> Back to Dashboard
            </Link>

            <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "2rem" }}>
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "16px",
                  background: "linear-gradient(135deg, var(--primary), #2dd4bf)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                }}
              >
                <Package size={28} />
              </div>
              <div>
                <h1 style={{ fontSize: "1.5rem", fontWeight: "bold" }}>Edit Item</h1>
                <p style={{ color: "var(--text-muted)" }}>Update details for your QR sticker item.</p>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="card" style={{ padding: "1.5rem", marginBottom: "1.5rem" }}>
                <h3 style={{ fontSize: "1.25rem", fontWeight: "bold", marginBottom: "1.5rem" }}>Item Details</h3>

                <div className="form-group">
                  <label className="form-label" htmlFor="name">Item Name *</label>
                  <input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. MacBook Pro"
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="category">Category *</label>
                  <select
                    id="category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="form-input"
                    required
                    style={{
                      appearance: "none",
                      backgroundImage:
                        "url(\"data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'/%3e%3c/svg%3e\")",
                      backgroundRepeat: "no-repeat",
                      backgroundPosition: "right 1rem center",
                      backgroundSize: "1em",
                    }}
                  >
                    <option value="" disabled>Select category</option>
                    {ITEM_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="description">Description</label>
                  <textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Add any identifying details..."
                    className="form-input"
                    style={{ minHeight: "100px", resize: "vertical" }}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="value">Estimated Value ($)</label>
                  <input
                    id="value"
                    type="number"
                    value={estimatedValue}
                    onChange={(e) => setEstimatedValue(e.target.value)}
                    placeholder="0.00"
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="instructions">Return Instructions</label>
                  <textarea
                    id="instructions"
                    value={returnInstructions}
                    onChange={(e) => setReturnInstructions(e.target.value)}
                    placeholder="Preferred pickup location, time window, or safety notes."
                    className="form-input"
                    style={{ minHeight: "100px", resize: "vertical" }}
                  />
                </div>
              </div>

              <div className="card" style={{ padding: "1.5rem", marginBottom: "1.5rem" }}>
                <h3 style={{ fontSize: "1.25rem", fontWeight: "bold", marginBottom: "1.5rem" }}>Contact Options</h3>

                <div className="form-group">
                  <label className="form-label" htmlFor="whatsapp">WhatsApp Number</label>
                  <input
                    id="whatsapp"
                    value={contactOptions.whatsAppNumber || ""}
                    onChange={(e) => setContactOptions({ ...contactOptions, whatsAppNumber: e.target.value })}
                    className="form-input"
                    placeholder="+91 90000 00000"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="phone">Phone Number</label>
                  <input
                    id="phone"
                    value={contactOptions.phoneNumber || ""}
                    onChange={(e) => setContactOptions({ ...contactOptions, phoneNumber: e.target.value })}
                    className="form-input"
                    placeholder="+91 90000 00000"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="email">Contact Email</label>
                  <input
                    id="email"
                    type="email"
                    value={contactOptions.email || ""}
                    onChange={(e) => setContactOptions({ ...contactOptions, email: e.target.value })}
                    className="form-input"
                    placeholder="owner@example.com"
                  />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: "1rem" }}>
                  {[
                    { key: "showWhatsApp", label: "WhatsApp" },
                    { key: "showCall", label: "Phone Call" },
                    { key: "showEmail", label: "Email" },
                    { key: "showInAppChat", label: "In-App Chat" },
                  ].map((opt) => (
                    <div key={opt.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.5rem 0" }}>
                      <label htmlFor={opt.key} style={{ fontWeight: 500 }}>{opt.label}</label>
                      <div style={{ position: "relative", width: "44px", height: "24px" }}>
                        <input
                          type="checkbox"
                          id={opt.key}
                          checked={contactOptions[opt.key as keyof ContactOptions] as boolean}
                          onChange={(e) => setContactOptions({ ...contactOptions, [opt.key]: e.target.checked })}
                          style={{ opacity: 0, width: 0, height: 0 }}
                        />
                        <span
                          style={{
                            position: "absolute",
                            cursor: "pointer",
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: contactOptions[opt.key as keyof ContactOptions] ? "var(--primary)" : "#ccc",
                            transition: ".4s",
                            borderRadius: "34px",
                          }}
                        >
                          <span
                            style={{
                              position: "absolute",
                              content: "\"\"",
                              height: "20px",
                              width: "20px",
                              left: "2px",
                              bottom: "2px",
                              backgroundColor: "white",
                              transition: ".4s",
                              borderRadius: "50%",
                              transform:
                                contactOptions[opt.key as keyof ContactOptions] ? "translateX(20px)" : "translateX(0)",
                            }}
                          />
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
              >
                <Save size={16} /> Save Changes
              </button>
            </form>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
