import { Router } from "express";
import { z } from "zod";
import { authRequired } from "../middleware/auth.js";
import { User } from "../models/User.js";

const router = Router();

router.get("/", authRequired, async (req, res) => {
  const user = await User.findById(req.user.id).lean();
  if (!user) return res.status(404).json({ error: "User not found" });
  return res.json({ id: user._id.toString(), email: user.email, name: user.name, phone: user.phone });
});

router.put("/", authRequired, async (req, res) => {
  const updateSchema = z.object({
    name: z.string().min(1).optional(),
    phone: z.string().optional(),
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
  return res.json({ id: user._id.toString(), email: user.email, name: user.name, phone: user.phone });
});

export default router;
