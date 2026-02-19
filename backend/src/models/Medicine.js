// src/models/Medicine.js
import mongoose from "mongoose";

const medicineSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    brand: { type: String, required: true },
    description: { type: String },
    price: { type: Number, required: true },
    stock: { type: Number, default: 0 },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    requiresPrescription: { type: Boolean, default: false },
    imageUrl: { type: String },
    averageRating: { type: Number, default: 0 },
    totalReviews: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// ─── Indexes for query performance ────────────────────────────────────────────
medicineSchema.index({ name: "text" });   // Full-text search on name
medicineSchema.index({ category: 1 });    // Filter by category
medicineSchema.index({ price: 1 });       // Sort/filter by price
medicineSchema.index({ stock: 1 });       // Filter low-stock items

const Medicine = mongoose.model("Medicine", medicineSchema);
export default Medicine;