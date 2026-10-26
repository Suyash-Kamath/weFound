import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import crypto from "crypto";
import { User } from "../models/User.js";
import { PasswordReset } from "../models/PasswordReset.js";
import { signToken } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/errors.js";
import { rateLimit } from "../middleware/rateLimit.js";
import { sendResetEmail } from "../utils/mailer.js";
import { serializeUser } from "../utils/serializers.js";

const router = Router();

const FIFTEEN_MINUTES = 15 * 60 * 1000;
const loginLimiter = rateLimit({ windowMs: FIFTEEN_MINUTES, max: 20, message: "Too many attempts. Please wait a few minutes and try again." });
const passwordResetLimiter = rateLimit({ windowMs: FIFTEEN_MINUTES, max: 5, message: "Too many reset requests. Please wait a few minutes and try again." });

// Emails are stored lowercase so "Ravi@x.com" and "ravi@x.com" are one account.
const emailField = z.string().trim().toLowerCase().email().max(254);
const passwordField = z.string().min(6).max(200);

const registerSchema = z.object({
  email: emailField,
  password: passwordField,
  name: z.string().trim().min(1).max(80),
  phone: z.string().trim().max(30).optional(),
});

const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1).max(200),
});

// Accounts created before emails were normalised may contain capitals.
async function findUserByEmail(email) {
  const exact = await User.findOne({ email });
  if (exact) return exact;
  return User.findOne({ email }).collation({ locale: "en", strength: 2 });
}

function issueSession(user) {
  const token = signToken({ id: user._id.toString(), email: user.email, name: user.name });
  return { token, user: serializeUser(user) };
}

router.post("/register", loginLimiter, asyncHandler(async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const existing = await findUserByEmail(parsed.data.email);
  if (existing) {
    return res.status(409).json({ error: "Email already registered" });
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  let user;
  try {
    user = await User.create({
      email: parsed.data.email,
      name: parsed.data.name,
      phone: parsed.data.phone || "",
      passwordHash,
    });
  } catch (error) {
    // Two sign-ups with the same email at the same moment
    if (error?.code === 11000) return res.status(409).json({ error: "Email already registered" });
    throw error;
  }

  return res.json(issueSession(user));
}));

router.post("/login", loginLimiter, asyncHandler(async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const user = await findUserByEmail(parsed.data.email);
  if (!user || !user.passwordHash) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const matches = await bcrypt.compare(parsed.data.password, user.passwordHash);
  if (!matches) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  return res.json(issueSession(user));
}));

const RESET_SENT_MESSAGE = "If the account exists, a reset email has been sent.";

router.post("/forgot-password", passwordResetLimiter, asyncHandler(async (req, res) => {
  const schema = z.object({ email: emailField });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const user = await findUserByEmail(parsed.data.email);
  if (!user) {
    return res.json({ message: RESET_SENT_MESSAGE });
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
    // Answer the same way as for unknown emails so this endpoint can't be used
    // to find out who has an account. The failure is logged by the mailer.
    // eslint-disable-next-line no-console
    console.error(`Password reset email could not be sent to user ${user._id.toString()}`);
  }

  return res.json({ message: RESET_SENT_MESSAGE });
}));

router.post("/reset-password", passwordResetLimiter, asyncHandler(async (req, res) => {
  const schema = z.object({
    email: emailField,
    token: z.string().min(10).max(200),
    password: passwordField,
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const user = await findUserByEmail(parsed.data.email);
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
  // Burn every outstanding reset link for this user, not just the one used.
  await PasswordReset.updateMany({ userId: user._id, usedAt: null }, { $set: { usedAt: new Date() } });

  return res.json({ message: "Password updated successfully." });
}));

export default router;
