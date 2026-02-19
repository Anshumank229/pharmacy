// src/models/Coupon.js
import mongoose from "mongoose";

const couponSchema = new mongoose.Schema(
  {
    // Core fields
    code: { 
      type: String, 
      required: true, 
      unique: true,
      uppercase: true,
      trim: true
    },
    discountPercent: { 
      type: Number, 
      required: true,
      min: 0,
      max: 100
    },
    
    // FIX: Standardized field name from 'minAmount' to 'minOrderAmount'
    minOrderAmount: { 
      type: Number, 
      default: 0,
      min: 0
    },
    
    // FIX: Standardized field name from 'expiryDate' to 'validUntil'
    validUntil: { 
      type: Date 
    },
    
    // Additional fields for better coupon management
    validFrom: { 
      type: Date,
      default: Date.now 
    },
    
    maxDiscount: { 
      type: Number,
      min: 0,
      comment: "Maximum discount amount in rupees"
    },
    
    usageLimit: { 
      type: Number,
      default: null,
      comment: "Maximum number of times this coupon can be used"
    },
    
    usedCount: { 
      type: Number, 
      default: 0,
      min: 0
    },
    
    isActive: { 
      type: Boolean, 
      default: true 
    },
    
    description: { 
      type: String,
      default: ''
    },
    
    // For admin use
    createdBy: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User" 
    },
    
    applicableCategories: [{
      type: String,
      comment: "Specific medicine categories this coupon applies to"
    }],
    
    excludedProducts: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Medicine"
    }],
    
    firstTimeOnly: { 
      type: Boolean, 
      default: false 
    },
    
    userSpecific: { 
      type: Boolean, 
      default: false 
    },
    
    applicableUsers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }]
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// ─── Virtuals ─────────────────────────────────────────────────────────────────

// Check if coupon is expired
couponSchema.virtual('isExpired').get(function() {
  return this.validUntil && this.validUntil < new Date();
});

// Check if coupon is valid (active, not expired, within date range)
couponSchema.virtual('isValid').get(function() {
  const now = new Date();
  const validFromCheck = !this.validFrom || this.validFrom <= now;
  const validUntilCheck = !this.validUntil || this.validUntil >= now;
  return this.isActive && validFromCheck && validUntilCheck;
});

// Check if usage limit reached
couponSchema.virtual('isUsageLimitReached').get(function() {
  return this.usageLimit && this.usedCount >= this.usageLimit;
});

// Remaining uses
couponSchema.virtual('remainingUses').get(function() {
  if (!this.usageLimit) return null;
  return Math.max(0, this.usageLimit - this.usedCount);
});

// ─── Methods ─────────────────────────────────────────────────────────────────

// Check if coupon can be applied to a specific cart total
couponSchema.methods.canBeApplied = function(cartTotal) {
  if (!this.isValid) return false;
  if (cartTotal < this.minOrderAmount) return false;
  if (this.isUsageLimitReached) return false;
  return true;
};

// Calculate discount amount
couponSchema.methods.calculateDiscount = function(cartTotal) {
  let discount = Math.round((cartTotal * this.discountPercent) / 100);
  
  // Apply max discount cap if exists
  if (this.maxDiscount && discount > this.maxDiscount) {
    discount = this.maxDiscount;
  }
  
  return discount;
};

// Increment usage count
couponSchema.methods.incrementUsage = async function() {
  this.usedCount += 1;
  return this.save();
};

// ─── Indexes ──────────────────────────────────────────────────────────────────
// Note: code index is created automatically by unique:true above

// For querying active coupons
couponSchema.index({ isActive: 1, validFrom: 1, validUntil: 1 });

// For expiry checks
couponSchema.index({ validUntil: 1 });

// For filtering by date ranges
couponSchema.index({ validFrom: 1, validUntil: 1 });

// For usage limit queries
couponSchema.index({ usageLimit: 1, usedCount: 1 });

// For admin analytics
couponSchema.index({ createdAt: -1 });
couponSchema.index({ discountPercent: 1 });

// ─── Pre-save Middleware ─────────────────────────────────────────────────────

// Ensure code is always uppercase and trimmed
couponSchema.pre('save', function(next) {
  if (this.code) {
    this.code = this.code.toUpperCase().trim();
  }
  next();
});

// Validate dates
couponSchema.pre('save', function(next) {
  if (this.validFrom && this.validUntil && this.validFrom > this.validUntil) {
    next(new Error('Valid from date cannot be after valid until date'));
  }
  next();
});

const Coupon = mongoose.model("Coupon", couponSchema);

export default Coupon;