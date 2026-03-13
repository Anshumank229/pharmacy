// src/models/User.js
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      unique: true,
      sparse: true, // Allows null/undefined values while maintaining uniqueness
      lowercase: true
    },
    phone: {
      type: String,
      unique: true,
      sparse: true // Allows null/undefined values
    },
    password: { type: String }, // Made optional for OTP/Google users
    role: { type: String, enum: ["user", "admin"], default: "user" },
    address: { type: String },

    // ── Google Auth ─────────────────────────────────────────────────────────
    googleId: {
      type: String,
      unique: true,
      sparse: true
    },
    avatar: { type: String }, // Profile picture from Google

    // ── Email/Phone Verification ────────────────────────────────────────────
    isEmailVerified: { type: Boolean, default: false },
    isPhoneVerified: { type: Boolean, default: false },

    // ── OTP Storage ─────────────────────────────────────────────────────────
    otp: {
      code: { type: String }, // 6-digit OTP
      expiresAt: { type: Date },
      type: { type: String, enum: ["email", "phone"] }, // What type of OTP was sent
      attempts: { type: Number, default: 0 } // Track verification attempts
    },

    // ── Forgot Password ──────────────────────────────────────────────────────
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },

    // ── Account Status ──────────────────────────────────────────────────────────
    // FIX C3: Added isActive field — missing from original schema.
    // Used by adminController.toggleUserStatus and enforced in authMiddleware.
    isActive: { type: Boolean, default: true },

    // ── Two-Factor Authentication (TOTP) ─────────────────────────────────────
    // UPGRADE 2: Admin 2FA — TOTP secret is excluded from all queries by default.
    // Only loaded when explicitly requested via .select("+twoFactorSecret").
    twoFactorSecret: { type: String, select: false },
    twoFactorEnabled: { type: Boolean, default: false }
  },
  { timestamps: true }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
// MongoDB automatically creates indexes for unique fields (email, phone, googleId)
// We only need manual indexes for non-unique fields we query frequently

// Index for password reset lookups
userSchema.index({ resetPasswordToken: 1 });

// FIX C1: REMOVED TTL index on otp.expiresAt.
// A TTL index deletes the ENTIRE document (the whole user account) when
// otp.expiresAt passes — not just the OTP subdocument.
// OTP expiry is now validated in controller logic (verifyOTP method checks Date).
// The otp fields remain on the schema; they are just cleaned up via clearOTP().

// Compound index for finding users by verification status (useful for admin queries)
userSchema.index({ isEmailVerified: 1, isPhoneVerified: 1 });

// Index for role-based queries (admin dashboard)
userSchema.index({ role: 1, createdAt: -1 });

// ─── Password Hooks ─────────────────────────────────────────────────────────
// Hash password before save (only if password is modified and exists)
userSchema.pre("save", async function (next) {
  if (!this.isModified("password") || !this.password) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ─── Instance Methods ───────────────────────────────────────────────────────
// Compare password
userSchema.methods.matchPassword = async function (enteredPassword) {
  if (!this.password) return false; // Users without password (Google/OTP) can't use password login
  return bcrypt.compare(enteredPassword, this.password);
};

// Check if user can login with password
userSchema.methods.hasPassword = function () {
  return !!this.password;
};

// Generate OTP
userSchema.methods.generateOTP = function () {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  this.otp = {
    code: otp,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    attempts: 0
  };
  return otp;
};

// Verify OTP
userSchema.methods.verifyOTP = function (enteredOTP) {
  if (!this.otp || !this.otp.code) return false;
  if (new Date() > this.otp.expiresAt) return false;
  if (this.otp.attempts >= 5) return false; // Max 5 attempts

  const isValid = this.otp.code === enteredOTP;
  if (!isValid) {
    this.otp.attempts += 1;
  }
  return isValid;
};

// Clear OTP after successful verification
userSchema.methods.clearOTP = function () {
  this.otp = undefined;
};

// ─── Static Methods ─────────────────────────────────────────────────────────
// Check if email is available for registration
userSchema.statics.isEmailAvailable = async function (email) {
  const user = await this.findOne({ email });
  return !user;
};

// Check if phone is available for registration
userSchema.statics.isPhoneAvailable = async function (phone) {
  const user = await this.findOne({ phone });
  return !user;
};

// Find or create Google user
userSchema.statics.findOrCreateGoogleUser = async function (profile) {
  let user = await this.findOne({ googleId: profile.id });

  if (!user) {
    // Check if user exists with same email
    user = await this.findOne({ email: profile.email });

    if (user) {
      // Link Google account to existing user
      user.googleId = profile.id;
      user.avatar = profile.picture || user.avatar;
      user.isEmailVerified = true;
    } else {
      // Create new user
      user = new this({
        name: profile.name,
        email: profile.email,
        googleId: profile.id,
        avatar: profile.picture,
        isEmailVerified: true,
        password: undefined // No password for Google users
      });
    }
    await user.save();
  }

  return user;
};

const User = mongoose.model("User", userSchema);
export default User;