import { Router } from "express";
import { z } from "zod";
import { authRequired } from "../middleware/auth.js";
import { Item } from "../models/Item.js";
import { Sticker } from "../models/Sticker.js";

const router = Router();

const itemSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  category: z.string().min(1),
  photos: z.array(z.string()).optional(),
  estimatedValue: z.number().optional(),
  stickerId: z.string().optional(),
  contactOptions: z.object({
    showWhatsApp: z.boolean().default(true),
    showCall: z.boolean().default(true),
    showSms: z.boolean().default(false),
    showEmail: z.boolean().default(true),
    showInAppChat: z.boolean().default(true),
    whatsAppNumber: z.string().optional(),
    phoneNumber: z.string().optional(),
    email: z.string().optional(),
  }),
  returnInstructions: z.string().optional(),
});

router.post("/", authRequired, async (req, res) => {
  const parsed = itemSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const item = await Item.create({
    userId: req.user.id,
    name: parsed.data.name,
    description: parsed.data.description || "",
    category: parsed.data.category,
    photos: parsed.data.photos || [],
    estimatedValue: parsed.data.estimatedValue,
    stickerId: parsed.data.stickerId || null,
    contactOptions: parsed.data.contactOptions,
    returnInstructions: parsed.data.returnInstructions || "",
  });

  if (item.stickerId) {
    await Sticker.findByIdAndUpdate(item.stickerId, {
      $set: { itemId: item._id, status: "active" },
    });
  }

  return res.json({ item });
});

router.get("/", authRequired, async (req, res) => {
  const items = await Item.find({ userId: req.user.id }).lean();
  return res.json({ items });
});

router.get("/:id", authRequired, async (req, res) => {
  const item = await Item.findOne({ _id: req.params.id, userId: req.user.id }).lean();
  if (!item) return res.status(404).json({ error: "Item not found" });
  return res.json({ item });
});

router.put("/:id", authRequired, async (req, res) => {
  const parsed = itemSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const item = await Item.findOneAndUpdate(
    { _id: req.params.id, userId: req.user.id },
    { $set: parsed.data },
    { new: true }
  ).lean();

  if (!item) return res.status(404).json({ error: "Item not found" });
  return res.json({ item });
});

router.delete("/:id", authRequired, async (req, res) => {
  const item = await Item.findOne({ _id: req.params.id, userId: req.user.id });
  if (!item) return res.status(404).json({ error: "Item not found" });

  if (item.stickerId) {
    await Sticker.findByIdAndUpdate(item.stickerId, {
      $set: { itemId: null, status: "pending" },
    });
  }

  await item.deleteOne();
  return res.json({ success: true });
});

export default router;
