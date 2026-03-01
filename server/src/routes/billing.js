import { Router } from "express";
import { z } from "zod";
import { authRequired } from "../middleware/auth.js";
import { User } from "../models/User.js";

const router = Router();

const PLAN_CONFIG = {
  basic: { name: "Basic", stickerCredits: 1, unlimitedStickers: false },
  plus: { name: "Plus", stickerCredits: 6, unlimitedStickers: false },
  business: { name: "Business", stickerCredits: 0, unlimitedStickers: true },
};

router.get("/status", authRequired, async (req, res) => {
  const user = await User.findById(req.user.id).lean();
  if (!user) return res.status(404).json({ error: "User not found" });

  return res.json({
    plan: user.plan || "none",
    stickerCreditsRemaining: user.stickerCreditsRemaining || 0,
    stickerCreditsUsed: user.stickerCreditsUsed || 0,
    unlimitedStickers: Boolean(user.unlimitedStickers),
  });
});

router.post("/purchase", authRequired, async (req, res) => {
  const schema = z.object({
    plan: z.enum(["basic", "plus", "business"]),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ error: "User not found" });

  const selectedPlan = PLAN_CONFIG[parsed.data.plan];
  user.plan = parsed.data.plan;
  user.unlimitedStickers = selectedPlan.unlimitedStickers;
  if (!selectedPlan.unlimitedStickers) {
    user.stickerCreditsRemaining = (user.stickerCreditsRemaining || 0) + selectedPlan.stickerCredits;
  }
  await user.save();

  return res.json({
    success: true,
    plan: user.plan,
    stickerCreditsRemaining: user.stickerCreditsRemaining || 0,
    stickerCreditsUsed: user.stickerCreditsUsed || 0,
    unlimitedStickers: Boolean(user.unlimitedStickers),
    message: `Purchased ${selectedPlan.name} plan successfully.`,
  });
});

export default router;
