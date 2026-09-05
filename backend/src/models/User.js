import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["officer", "admin"], default: "officer" },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
