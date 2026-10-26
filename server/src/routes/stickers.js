import { Router } from "express";
import { z } from "zod";
import { authRequired } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/errors.js";
import { Sticker } from "../models/Sticker.js";
import { Item } from "../models/Item.js";
import { User } from "../models/User.js";
import { generateShortCode } from "../utils/helpers.js";
import { linkStickerToItem } from "../services/stickerLinks.js";

const router = Router();

async function createStickerWithUniqueCode(userId) {
  // 32^8 possible codes makes a clash very unlikely, but retry if one happens.
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      return await Sticker.create({
        shortCode: generateShortCode(),
        status: "pending",
        userId,
        itemId: null,
      });
    } catch (error) {
      if (error?.code !== 11000) throw error;
    }
  }
  throw new Error("Could not generate a unique sticker code");
}

router.post("/", authRequired, asyncHandler(async (req, res) => {
  const schema = z.object({ count: z.number().int().min(1).max(50).optional() });
  const parsed = schema.safeParse(req.body || {});
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const count = parsed.data.count || 1;
  const user = await User.findById(req.user.id).lean();
  if (!user) return res.status(404).json({ error: "User not found" });

  // Take the credits in one atomic step before creating anything, so two
  // requests at the same moment can't both spend the same credit.
  let charged = false;
  if (user.unlimitedStickers) {
    await User.updateOne({ _id: user._id }, { $inc: { stickerCreditsUsed: count } });
  } else {
    const updated = await User.findOneAndUpdate(
      { _id: user._id, unlimitedStickers: { $ne: true }, stickerCreditsRemaining: { $gte: count } },
      { $inc: { stickerCreditsRemaining: -count, stickerCreditsUsed: count } },
      { new: true }
    ).lean();
    if (!updated) {
      const latest = await User.findById(user._id).lean();
      return res.status(402).json({
        error: "No sticker credits left. Please purchase a plan to generate more stickers.",
        stickerCreditsRemaining: latest?.stickerCreditsRemaining || 0,
        requested: count,
      });
    }
    charged = true;
  }

  const stickers = [];
  try {
    for (let i = 0; i < count; i += 1) {
      stickers.push(await createStickerWithUniqueCode(user._id));
    }
  } catch (error) {
    // Give back the credits for stickers that were never created.
    const missing = count - stickers.length;
    const refund = charged
      ? { stickerCreditsRemaining: missing, stickerCreditsUsed: -missing }
      : { stickerCreditsUsed: -missing };
    await User.updateOne({ _id: user._id }, { $inc: refund });
    throw error;
  }

  return res.json({ stickers });
}));

router.get("/", authRequired, asyncHandler(async (req, res) => {
  const stickers = await Sticker.find({ userId: req.user.id }).lean();
  return res.json({ stickers });
}));

router.get("/:id", authRequired, asyncHandler(async (req, res) => {
  const sticker = await Sticker.findOne({ _id: req.params.id, userId: req.user.id }).lean();
  if (!sticker) return res.status(404).json({ error: "Sticker not found" });
  return res.json({ sticker });
}));

router.post("/:id/map", authRequired, asyncHandler(async (req, res) => {
  const schema = z.object({ itemId: z.string().min(1) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const sticker = await Sticker.findOne({ _id: req.params.id, userId: req.user.id });
  if (!sticker) return res.status(404).json({ error: "Sticker not found" });

  const item = await Item.findOne({ _id: parsed.data.itemId, userId: req.user.id });
  if (!item) return res.status(404).json({ error: "Item not found" });

  await linkStickerToItem(sticker, item);

  const updated = await Sticker.findById(sticker._id).lean();
  return res.json({ sticker: updated });
}));

router.post("/:id/deactivate", authRequired, asyncHandler(async (req, res) => {
  const sticker = await Sticker.findOne({ _id: req.params.id, userId: req.user.id });
  if (!sticker) return res.status(404).json({ error: "Sticker not found" });
  sticker.status = "inactive";
  await sticker.save();
  return res.json({ sticker });
}));

export default router;
