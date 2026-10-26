import { Router } from "express";
import { z } from "zod";
import { authRequired } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/errors.js";
import { User } from "../models/User.js";

const router = Router();

const PLAN_CONFIG = {
  basic: { name: "Basic", stickerCredits: 1 },
  plus: { name: "Plus", stickerCredits: 6 },
};

// No payment provider is connected yet, so this endpoint hands out credits
// without charging. Set ALLOW_UNPAID_PURCHASES=false to switch it off once
// real payments (e.g. Razorpay) are in place or if you need to stop free credits.
const unpaidPurchasesAllowed = () => process.env.ALLOW_UNPAID_PURCHASES !== "false";

router.get("/status", authRequired, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).lean();
  if (!user) return res.status(404).json({ error: "User not found" });

  return res.json({
    plan: user.plan || "none",
    stickerCreditsRemaining: user.stickerCreditsRemaining || 0,
    stickerCreditsUsed: user.stickerCreditsUsed || 0,
    unlimitedStickers: Boolean(user.unlimitedStickers),
  });
}));

router.post("/purchase", authRequired, asyncHandler(async (req, res) => {
  const schema = z.object({
    plan: z.enum(["basic", "plus", "business"]),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  // Business gives unlimited stickers and is sold through sales, never self-serve.
  if (parsed.data.plan === "business") {
    return res.status(403).json({ error: "The Business plan is set up by our sales team. Please contact us." });
  }

  if (!unpaidPurchasesAllowed()) {
    return res.status(503).json({ error: "Online payments are not available yet. Please contact us to buy a plan." });
  }

  const selectedPlan = PLAN_CONFIG[parsed.data.plan];
  const existing = await User.findById(req.user.id).lean();
  if (!existing) return res.status(404).json({ error: "User not found" });

  // Atomic increment so two quick purchases both count, and a Business
  // customer buying a small pack keeps their unlimited plan.
  const update = { $inc: { stickerCreditsRemaining: selectedPlan.stickerCredits } };
  if (!existing.unlimitedStickers) update.$set = { plan: parsed.data.plan };
  const user = await User.findByIdAndUpdate(req.user.id, update, { new: true }).lean();
  if (!user) return res.status(404).json({ error: "User not found" });

  return res.json({
    success: true,
    plan: user.plan,
    stickerCreditsRemaining: user.stickerCreditsRemaining || 0,
    stickerCreditsUsed: user.stickerCreditsUsed || 0,
    unlimitedStickers: Boolean(user.unlimitedStickers),
    message: `Purchased ${selectedPlan.name} plan successfully.`,
  });
}));

export default router;
