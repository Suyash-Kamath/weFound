import { useMemo, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { useAuthStore } from "@/stores/authStore";
import { api, ApiError } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, CreditCard, Loader2 } from "lucide-react";

const PLAN_DETAILS = {
  basic: {
    label: "Basic",
    price: "₹50",
    stickers: 1,
    description: "Get 1 sticker credit to protect your first item.",
  },
  plus: {
    label: "Plus",
    price: "₹249",
    stickers: 6,
    description: "Get 6 sticker credits for multi-item protection.",
  },
  business: {
    label: "Business",
    price: "Custom",
    stickers: "Unlimited",
    description: "Contact sales for enterprise billing and bulk onboarding.",
  },
} as const;

type PlanKey = keyof typeof PLAN_DETAILS;

export default function PurchasePlan() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated, isHydrating, hydrate } = useAuthStore();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const plan = (searchParams.get("plan") || "basic") as PlanKey;
  const details = useMemo(() => PLAN_DETAILS[plan] || PLAN_DETAILS.basic, [plan]);

  if (!isHydrating && !isAuthenticated) {
    return (
      <div className="dashboard-layout">
        <Navbar />
        <main className="dashboard-main">
          <div className="container" style={{ maxWidth: "720px" }}>
            <div className="page-card">
              <h3>Sign In Required</h3>
              <p>Please sign in first to purchase a plan and get sticker credits.</p>
              <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
                <Link to="/auth" className="btn btn-primary">Go to Sign In</Link>
                <Link to="/pricing" className="btn btn-outline">Back to Pricing</Link>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const handlePurchase = async () => {
    if (plan === "business") {
      navigate("/contact");
      return;
    }

    setLoading(true);
    try {
      await api.post("/billing/purchase", { plan });
      await hydrate();
      toast({
        title: "Purchase successful",
        description: `${details.label} plan activated. Sticker credits added.`,
      });
      navigate("/dashboard");
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Could not complete purchase.";
      toast({
        title: "Purchase failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-layout">
      <Navbar />
      <main className="dashboard-main">
        <div className="container" style={{ maxWidth: "720px" }}>
          <Link
            to="/pricing"
            className="btn btn-outline"
            style={{ display: "inline-flex", alignItems: "center", gap: "8px", marginBottom: "1.25rem" }}
          >
            <ArrowLeft size={16} /> Back to Pricing
          </Link>

          <div className="page-card">
            <h2 style={{ marginBottom: "0.25rem" }}>Purchase {details.label} Plan</h2>
            <p style={{ color: "var(--text-muted)", marginBottom: "1.5rem" }}>{details.description}</p>

            <div style={{ border: "1px solid var(--border)", borderRadius: "12px", padding: "1rem", marginBottom: "1rem" }}>
              <p style={{ margin: 0, color: "var(--text-muted)" }}>Plan</p>
              <h3 style={{ margin: "0.25rem 0 0.75rem 0" }}>{details.label}</h3>
              <p style={{ margin: 0, color: "var(--text-muted)" }}>Price</p>
              <p style={{ fontSize: "1.5rem", fontWeight: 700, margin: "0.25rem 0 0.75rem 0" }}>{details.price}</p>
              <p style={{ margin: 0, color: "var(--text-muted)" }}>Sticker credits</p>
              <p style={{ fontWeight: 600, margin: "0.25rem 0 0 0" }}>{details.stickers}</p>
            </div>

            <button className="btn btn-primary" onClick={handlePurchase} disabled={loading} style={{ width: "100%" }}>
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Processing...
                </>
              ) : (
                <>
                  <CreditCard size={16} /> {plan === "business" ? "Talk to Sales" : "Complete Purchase"}
                </>
              )}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
