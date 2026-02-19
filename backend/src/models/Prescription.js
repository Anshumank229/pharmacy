// src/models/Prescription.js
import mongoose from "mongoose";

const prescriptionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    
    // FIX: Make imageUrl optional since local files don't have a public URL
    imageUrl: { 
      type: String, 
      required: false // Changed from true to false
    },
    
    // FIX: Add fileName field for local storage
    fileName: { 
      type: String,
      required: false
    },
    
    // FIX: Add originalName for display
    originalName: { 
      type: String,
      required: false
    },
    
    // FIX: Add fileSize and mimeType for better tracking
    fileSize: {
      type: Number,
      required: false
    },
    
    mimeType: {
      type: String,
      required: false
    },
    
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending"
    },
    
    notes: { type: String },
    
    cloudinaryPublicId: { type: String }, // Stored for future deletion from Cloudinary
    
    // FIX: Add admin review tracking
    reviewedBy: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User" 
    },
    
    reviewedAt: { 
      type: Date 
    },
    
    adminNotes: { 
      type: String 
    }
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// ─── Virtual for getting file URL ─────────────────────────────────────────────
prescriptionSchema.virtual('fileUrl').get(function() {
  if (this.imageUrl) {
    return this.imageUrl; // Cloudinary URL
  }
  if (this.fileName) {
    // Local file - return protected route
    return `/api/prescriptions/${this._id}/file`;
  }
  return null;
});

// ─── Virtual for file type ───────────────────────────────────────────────────
prescriptionSchema.virtual('isImage').get(function() {
  return this.mimeType?.startsWith('image/') || this.imageUrl?.match(/\.(jpg|jpeg|png|gif|webp)$/i);
});

prescriptionSchema.virtual('isPdf').get(function() {
  return this.mimeType === 'application/pdf' || this.originalName?.endsWith('.pdf');
});

// ─── Indexes for query performance ────────────────────────────────────────────
prescriptionSchema.index({ user: 1 });                     // Fetch prescriptions by user
prescriptionSchema.index({ status: 1 });                   // Filter pending/approved/rejected
prescriptionSchema.index({ createdAt: -1 });               // Sort by date
prescriptionSchema.index({ reviewedBy: 1 });               // Admin review tracking
prescriptionSchema.index({ user: 1, status: 1 });          // Compound index for user status queries

const Prescription = mongoose.model("Prescription", prescriptionSchema);

export default Prescription;