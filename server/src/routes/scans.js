import { Router } from "express";
import { z } from "zod";
import { Scan } from "../models/Scan.js";
import { Sticker } from "../models/Sticker.js";
import { authRequired } from "../middleware/auth.js";

const router = Router();

const scanSchema = z.object({
  shortCode: z.string().min(1).optional(),
  stickerId: z.string().min(1).optional(),
  deviceInfo: z
    .object({
      os: z.string().optional(),
      browser: z.string().optional(),
      device: z.string().optional(),
    })
    .optional(),
  location: z
    .object({
      lat: z.number(),
      lng: z.number(),
      city: z.string().optional(),
      country: z.string().optional(),
    })
    .optional(),
});

router.post("/", async (req, res) => {
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
});

router.get("/sticker/:id", authRequired, async (req, res) => {
  const scans = await Scan.find({ stickerId: req.params.id }).sort({ createdAt: -1 }).lean();
  return res.json({ scans });
});

export default router;
