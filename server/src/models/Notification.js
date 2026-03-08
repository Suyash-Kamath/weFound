import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    conversationId: { type: mongoose.Schema.Types.ObjectId, ref: "Conversation", required: true, index: true },
    messageId: { type: mongoose.Schema.Types.ObjectId, ref: "ChatMessage", default: null },
    type: { type: String, enum: ["new_message", "incoming_call"], required: true },
    title: { type: String, required: true },
    body: { type: String, default: "" },
    readAt: { type: Date, default: null },
  },
  { timestamps: true }
);

notificationSchema.index({ userId: 1, readAt: 1, createdAt: -1 });

export const Notification = mongoose.model("Notification", notificationSchema);
