import mongoose from "mongoose";

const contactOptionsSchema = new mongoose.Schema(
  {
    showWhatsApp: { type: Boolean, default: true },
    showCall: { type: Boolean, default: true },
    showSms: { type: Boolean, default: false },
    showEmail: { type: Boolean, default: true },
    showInAppChat: { type: Boolean, default: true },
    whatsAppNumber: { type: String, default: "" },
    phoneNumber: { type: String, default: "" },
    email: { type: String, default: "" },
  },
  { _id: false }
);

const itemSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    description: { type: String, default: "" },
    category: { type: String, required: true },
    photos: { type: [String], default: [] },
    estimatedValue: { type: Number, default: null },
    stickerId: { type: mongoose.Schema.Types.ObjectId, ref: "Sticker", default: null },
    contactOptions: { type: contactOptionsSchema, required: true },
    returnInstructions: { type: String, default: "" },
  },
  { timestamps: true }
);

export const Item = mongoose.model("Item", itemSchema);
