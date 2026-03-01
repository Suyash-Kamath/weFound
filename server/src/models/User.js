import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    phone: { type: String, default: "" },
    passwordHash: { type: String, required: true },
    plan: { type: String, enum: ["none", "basic", "plus", "business"], default: "none" },
    stickerCreditsRemaining: { type: Number, default: 0 },
    stickerCreditsUsed: { type: Number, default: 0 },
    unlimitedStickers: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const User = mongoose.model("User", userSchema);
