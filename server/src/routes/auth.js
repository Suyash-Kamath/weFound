import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import crypto from "crypto";
import { User } from "../models/User.js";
import { PasswordReset } from "../models/PasswordReset.js";
import { signToken } from "../middleware/auth.js";
import { sendResetEmail } from "../utils/mailer.js";

const router = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
  phone: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

router.post("/register", async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const existing = await User.findOne({ email: parsed.data.email });
  if (existing) {
    if (!existing.passwordHash) {
      existing.passwordHash = await bcrypt.hash(parsed.data.password, 10);
      existing.name = parsed.data.name || existing.name;
      existing.phone = parsed.data.phone || existing.phone;
      await existing.save();
      const token = signToken({ id: existing._id.toString(), email: existing.email, name: existing.name });
      return res.json({
        token,
        user: { id: existing._id.toString(), email: existing.email, name: existing.name, phone: existing.phone },
      });
    }
    return res.status(409).json({ error: "Email already registered" });
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  const user = await User.create({
    email: parsed.data.email,
    name: parsed.data.name,
    phone: parsed.data.phone || "",
    passwordHash,
  });

  const token = signToken({ id: user._id.toString(), email: user.email, name: user.name });
  return res.json({
    token,
    user: { id: user._id.toString(), email: user.email, name: user.name, phone: user.phone },
  });
});

router.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const user = await User.findOne({ email: parsed.data.email });
  if (!user) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  if (!user.passwordHash) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const matches = await bcrypt.compare(parsed.data.password, user.passwordHash);
  if (!matches) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const token = signToken({ id: user._id.toString(), email: user.email, name: user.name });
  return res.json({
    token,
    user: { id: user._id.toString(), email: user.email, name: user.name, phone: user.phone },
  });
});

router.post("/forgot-password", async (req, res) => {
  const schema = z.object({ email: z.string().email() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const user = await User.findOne({ email: parsed.data.email });
  if (!user) {
    return res.json({ message: "If the account exists, a reset email has been sent." });
  }

  const rawToken = crypto.randomBytes(24).toString("hex");
  const tokenHash = await bcrypt.hash(rawToken, 10);
  const expiresAt = new Date(Date.now() + 1000 * 60 * 30);

  await PasswordReset.create({
    userId: user._id,
    tokenHash,
    expiresAt,
  });

  const frontendBase = process.env.FRONTEND_BASE_URL || "http://localhost:5173";
  const resetLink = `${frontendBase}/auth?mode=reset&email=${encodeURIComponent(user.email)}&token=${encodeURIComponent(rawToken)}`;

  const sent = await sendResetEmail({ to: user.email, name: user.name, token: rawToken, resetLink });
  if (!sent) {
    return res.status(500).json({ error: "Failed to send reset email. Check SMTP settings." });
  }

  return res.json({ message: "If the account exists, a reset email has been sent." });
});

router.post("/reset-password", async (req, res) => {
  const schema = z.object({
    email: z.string().email(),
    token: z.string().min(10),
    password: z.string().min(6),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const user = await User.findOne({ email: parsed.data.email });
  if (!user) {
    return res.status(400).json({ error: "Invalid token or email" });
  }

  const resets = await PasswordReset.find({
    userId: user._id,
    usedAt: null,
    expiresAt: { $gt: new Date() },
  }).sort({ createdAt: -1 });

  let matched = null;
  for (const reset of resets) {
    const ok = await bcrypt.compare(parsed.data.token, reset.tokenHash);
    if (ok) {
      matched = reset;
      break;
    }
  }

  if (!matched) {
    return res.status(400).json({ error: "Invalid token or email" });
  }

  user.passwordHash = await bcrypt.hash(parsed.data.password, 10);
  await user.save();
  matched.usedAt = new Date();
  await matched.save();

  return res.json({ message: "Password updated successfully." });
});

export default router;
