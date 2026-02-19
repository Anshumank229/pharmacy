import mongoose from "mongoose";

const medicineRequestSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    medicineName: {
      type: String,
      required: true,
      trim: true
    },
    manufacturer: {
      type: String,
      trim: true
    },
    dosage: {
      type: String,
      trim: true,
      comment: "e.g., 500mg, 10ml, etc."
    },
    quantity: {
      type: Number,
      default: 1,
      min: 1
    },
    purpose: {
      type: String,
      trim: true,
      comment: "Why do you need this medicine?"
    },
    prescriptionRequired: {
      type: Boolean,
      default: false
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "available", "ordered"],
      default: "pending"
    },
    adminNotes: {
      type: String
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    reviewedAt: {
      type: Date
    },
    estimatedArrival: {
      type: Date
    },
    alternativeOffered: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Medicine",
      comment: "Alternative medicine offered by admin"
    },
    notifiedViaEmail: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

// Indexes for performance
medicineRequestSchema.index({ user: 1, status: 1 });
medicineRequestSchema.index({ status: 1, createdAt: -1 });
medicineRequestSchema.index({ medicineName: "text" }); // Search by medicine name

const MedicineRequest = mongoose.model("MedicineRequest", medicineRequestSchema);
export default MedicineRequest;