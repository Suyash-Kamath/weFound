import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema(
  {
    itemId: { type: mongoose.Schema.Types.ObjectId, ref: "Item", required: true, index: true },
    stickerId: { type: mongoose.Schema.Types.ObjectId, ref: "Sticker", required: true, index: true },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    finderSessionId: { type: String, required: true, index: true },
    finderName: { type: String, default: "Finder" },
    status: { type: String, enum: ["active", "closed"], default: "active" },
    lastMessageAt: { type: Date, default: null },
  },
  { timestamps: true }
);

conversationSchema.index({ stickerId: 1, finderSessionId: 1, status: 1 }, { unique: true, partialFilterExpression: { status: "active" } });

export const Conversation = mongoose.model("Conversation", conversationSchema);
