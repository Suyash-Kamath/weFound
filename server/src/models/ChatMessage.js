import mongoose from "mongoose";

const chatMessageSchema = new mongoose.Schema(
  {
    conversationId: { type: mongoose.Schema.Types.ObjectId, ref: "Conversation", required: true, index: true },
    senderType: { type: String, enum: ["owner", "finder", "system"], required: true },
    senderUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    content: { type: String, required: true },
    messageType: { type: String, enum: ["text", "system"], default: "text" },
    readByOwner: { type: Boolean, default: false },
  },
  { timestamps: true }
);

chatMessageSchema.index({ conversationId: 1, createdAt: 1 });

export const ChatMessage = mongoose.model("ChatMessage", chatMessageSchema);
