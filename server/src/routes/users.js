import { Router } from "express";
import { z } from "zod";
import { authRequired } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/errors.js";
import { User } from "../models/User.js";
import { serializeUser } from "../utils/serializers.js";

const router = Router();

router.get("/", authRequired, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).lean();
  if (!user) return res.status(404).json({ error: "User not found" });
  return res.json(serializeUser(user));
}));

router.put("/", authRequired, asyncHandler(async (req, res) => {
  const updateSchema = z.object({
    name: z.string().trim().min(1).max(80).optional(),
    phone: z.string().trim().max(30).optional(),
  });
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const user = await User.findByIdAndUpdate(
    req.user.id,
    { $set: parsed.data },
    { new: true }
  ).lean();

  if (!user) return res.status(404).json({ error: "User not found" });
  return res.json(serializeUser(user));
}));

export default router;
