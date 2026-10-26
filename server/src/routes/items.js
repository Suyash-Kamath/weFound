import { Router } from "express";
import { z } from "zod";
import { authRequired } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/errors.js";
import { Item } from "../models/Item.js";
import { Sticker } from "../models/Sticker.js";
import { linkStickerToItem, unlinkStickersFromItem } from "../services/stickerLinks.js";

const router = Router();

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid id");

const itemSchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().max(2000).optional(),
  category: z.string().trim().min(1).max(60),
  photos: z.array(z.string().max(2048)).max(10).optional(),
  estimatedValue: z.number().nonnegative().finite().optional(),
  stickerId: objectId.optional(),
  contactOptions: z.object({
    showWhatsApp: z.boolean().default(true),
    showCall: z.boolean().default(true),
    showSms: z.boolean().default(false),
    showEmail: z.boolean().default(true),
    showInAppChat: z.boolean().default(true),
    whatsAppNumber: z.string().max(30).optional(),
    phoneNumber: z.string().max(30).optional(),
    email: z.string().max(254).optional(),
  }),
  returnInstructions: z.string().max(2000).optional(),
});

// Only the item's owner may attach one of their own stickers to it.
async function findOwnedSticker(stickerId, userId) {
  return Sticker.findOne({ _id: stickerId, userId });
}

router.post("/", authRequired, asyncHandler(async (req, res) => {
  const parsed = itemSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const sticker = parsed.data.stickerId ? await findOwnedSticker(parsed.data.stickerId, req.user.id) : null;
  if (parsed.data.stickerId && !sticker) return res.status(404).json({ error: "Sticker not found" });

  const item = await Item.create({
    userId: req.user.id,
    name: parsed.data.name,
    description: parsed.data.description || "",
    category: parsed.data.category,
    photos: parsed.data.photos || [],
    estimatedValue: parsed.data.estimatedValue,
    stickerId: null,
    contactOptions: parsed.data.contactOptions,
    returnInstructions: parsed.data.returnInstructions || "",
  });

  if (sticker) {
    await linkStickerToItem(sticker, item);
  }

  const saved = await Item.findById(item._id).lean();
  return res.json({ item: saved });
}));

router.get("/", authRequired, asyncHandler(async (req, res) => {
  const items = await Item.find({ userId: req.user.id }).lean();
  return res.json({ items });
}));

router.get("/:id", authRequired, asyncHandler(async (req, res) => {
  const item = await Item.findOne({ _id: req.params.id, userId: req.user.id }).lean();
  if (!item) return res.status(404).json({ error: "Item not found" });
  return res.json({ item });
}));

router.put("/:id", authRequired, asyncHandler(async (req, res) => {
  const parsed = itemSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { stickerId, ...updates } = parsed.data;

  const item = await Item.findOne({ _id: req.params.id, userId: req.user.id });
  if (!item) return res.status(404).json({ error: "Item not found" });

  if (stickerId && !(item.stickerId && item.stickerId.equals(stickerId))) {
    const sticker = await findOwnedSticker(stickerId, req.user.id);
    if (!sticker) return res.status(404).json({ error: "Sticker not found" });
    await linkStickerToItem(sticker, item);
  }

  const updated = await Item.findOneAndUpdate(
    { _id: item._id, userId: req.user.id },
    { $set: updates },
    { new: true }
  ).lean();

  if (!updated) return res.status(404).json({ error: "Item not found" });
  return res.json({ item: updated });
}));

router.delete("/:id", authRequired, asyncHandler(async (req, res) => {
  const item = await Item.findOne({ _id: req.params.id, userId: req.user.id });
  if (!item) return res.status(404).json({ error: "Item not found" });

  await unlinkStickersFromItem(item._id);
  await item.deleteOne();
  return res.json({ success: true });
}));

export default router;
