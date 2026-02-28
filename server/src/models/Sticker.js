import mongoose from "mongoose";

const stickerSchema = new mongoose.Schema(
  {
    shortCode: { type: String, required: true, unique: true, index: true },
    status: { type: String, enum: ["active", "inactive", "pending", "closed"], default: "pending" },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    itemId: { type: mongoose.Schema.Types.ObjectId, ref: "Item", default: null },
  },
  { timestamps: true }
);

export const Sticker = mongoose.model("Sticker", stickerSchema);
