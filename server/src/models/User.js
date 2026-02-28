import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    phone: { type: String, default: "" },
    passwordHash: { type: String, required: true },
  },
  { timestamps: true }
);

export const User = mongoose.model("User", userSchema);
