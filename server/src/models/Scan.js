import mongoose from "mongoose";

const scanSchema = new mongoose.Schema(
  {
    stickerId: { type: mongoose.Schema.Types.ObjectId, ref: "Sticker", required: true },
    deviceInfo: {
      os: { type: String, default: "" },
      browser: { type: String, default: "" },
      device: { type: String, default: "" },
    },
    location: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
      city: { type: String, default: "" },
      country: { type: String, default: "" },
    },
  },
  { timestamps: true }
);

export const Scan = mongoose.model("Scan", scanSchema);
