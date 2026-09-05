import mongoose from "mongoose";

// declarationField mirrors the shape in docs/api-contract.md exactly.
// Keep this in sync with the AI service response - do not diverge.
const declarationField = {
  found: { type: Boolean, default: false },
  value: { type: mongoose.Schema.Types.Mixed, default: null },
  confidence: { type: Number, default: 0 },
};

const scanSchema = new mongoose.Schema(
  {
    imageUrl: { type: String, required: true },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    declarations: {
      manufacturer_name_address: declarationField,
      net_quantity: declarationField,
      mrp: declarationField,
      mfg_date: declarationField,
      consumer_care: declarationField,
      country_of_origin: declarationField,
      generic_name: declarationField,
      unit_sale_price: declarationField,
    },
    overallStatus: {
      type: String,
      enum: ["COMPLIANT", "NON_COMPLIANT", "PENDING"],
      default: "PENDING",
    },
    violations: [String],
    reportPdfUrl: String,
  },
  { timestamps: true }
);

export default mongoose.model("Scan", scanSchema);
