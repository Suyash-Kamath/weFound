import { Router } from "express";
import { z } from "zod";
import { Scan } from "../models/Scan.js";
import { Sticker } from "../models/Sticker.js";
import { authRequired } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/errors.js";
import { rateLimit } from "../middleware/rateLimit.js";

const router = Router();

const scanLimiter = rateLimit({ windowMs: 10 * 60 * 1000, max: 60 });

const scanSchema = z
  .object({
    shortCode: z.string().min(1).max(32).optional(),
    stickerId: z.string().regex(/^[a-f\d]{24}$/i).optional(),
    deviceInfo: z
      .object({
        os: z.string().max(100).optional(),
        browser: z.string().max(100).optional(),
        device: z.string().max(100).optional(),
      })
      .optional(),
    location: z
      .object({
        lat: z.number().min(-90).max(90),
        lng: z.number().min(-180).max(180),
        city: z.string().max(100).optional(),
        country: z.string().max(100).optional(),
      })
      .optional(),
  })
  .refine((data) => data.shortCode || data.stickerId, { message: "shortCode or stickerId is required" });

router.post("/", scanLimiter, asyncHandler(async (req, res) => {
  const parsed = scanSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const sticker = parsed.data.stickerId
    ? await Sticker.findById(parsed.data.stickerId)
    : await Sticker.findOne({ shortCode: parsed.data.shortCode });

  if (!sticker) return res.status(404).json({ error: "Sticker not found" });

  const scan = await Scan.create({
    stickerId: sticker._id,
    deviceInfo: parsed.data.deviceInfo || {},
    location: parsed.data.location || {},
  });

  return res.json({ scan });
}));

router.get("/sticker/:id", authRequired, asyncHandler(async (req, res) => {
  // Scan history includes locations, so only the sticker's owner may see it.
  const sticker = await Sticker.findOne({ _id: req.params.id, userId: req.user.id }).lean();
  if (!sticker) return res.status(404).json({ error: "Sticker not found" });

  const scans = await Scan.find({ stickerId: sticker._id }).sort({ createdAt: -1 }).lean();
  return res.json({ scans });
}));

export default router;
