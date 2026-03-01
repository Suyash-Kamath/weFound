import { Router } from "express";
import { z } from "zod";
import { authRequired } from "../middleware/auth.js";
import { Sticker } from "../models/Sticker.js";
import { Item } from "../models/Item.js";
import { User } from "../models/User.js";
import { generateShortCode } from "../utils/helpers.js";

const router = Router();

router.post("/", authRequired, async (req, res) => {
  const schema = z.object({ count: z.number().int().min(1).max(50).optional() });
  const parsed = schema.safeParse(req.body || {});
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const count = parsed.data.count || 1;
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ error: "User not found" });

  if (!user.unlimitedStickers && (user.stickerCreditsRemaining || 0) < count) {
    return res.status(402).json({
      error: "No sticker credits left. Please purchase a plan to generate more stickers.",
      stickerCreditsRemaining: user.stickerCreditsRemaining || 0,
      requested: count,
    });
  }

  const stickers = [];
  for (let i = 0; i < count; i += 1) {
    const sticker = await Sticker.create({
      shortCode: generateShortCode(),
      status: "pending",
      userId: req.user.id,
      itemId: null,
    });
    stickers.push(sticker);
  }

  if (!user.unlimitedStickers) {
    user.stickerCreditsRemaining = (user.stickerCreditsRemaining || 0) - count;
  }
  user.stickerCreditsUsed = (user.stickerCreditsUsed || 0) + count;
  await user.save();

  return res.json({ stickers });
});

router.get("/", authRequired, async (req, res) => {
  const stickers = await Sticker.find({ userId: req.user.id }).lean();
  return res.json({ stickers });
});

router.get("/:id", authRequired, async (req, res) => {
  const sticker = await Sticker.findOne({ _id: req.params.id, userId: req.user.id }).lean();
  if (!sticker) return res.status(404).json({ error: "Sticker not found" });
  return res.json({ sticker });
});

router.post("/:id/claim", authRequired, async (req, res) => {
  const sticker = await Sticker.findById(req.params.id);
  if (!sticker) return res.status(404).json({ error: "Sticker not found" });
  if (sticker.userId) return res.status(409).json({ error: "Sticker already claimed" });
  sticker.userId = req.user.id;
  await sticker.save();
  return res.json({ sticker });
});

router.post("/:id/map", authRequired, async (req, res) => {
  const schema = z.object({ itemId: z.string().min(1) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const sticker = await Sticker.findOne({ _id: req.params.id, userId: req.user.id });
  if (!sticker) return res.status(404).json({ error: "Sticker not found" });

  const item = await Item.findOne({ _id: parsed.data.itemId, userId: req.user.id });
  if (!item) return res.status(404).json({ error: "Item not found" });

  sticker.itemId = item._id;
  sticker.status = "active";
  await sticker.save();

  if (!item.stickerId) {
    item.stickerId = sticker._id;
    await item.save();
  }

  return res.json({ sticker });
});

router.post("/:id/deactivate", authRequired, async (req, res) => {
  const sticker = await Sticker.findOne({ _id: req.params.id, userId: req.user.id });
  if (!sticker) return res.status(404).json({ error: "Sticker not found" });
  sticker.status = "inactive";
  await sticker.save();
  return res.json({ sticker });
});

export default router;
