// src/controllers/authController.js
import crypto from "crypto";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { generateAccessToken, generateRefreshToken } from "../utils/generateToken.js";
import { sendWelcomeEmail, sendPasswordResetEmail } from "../services/emailService.js";
import logger from "../utils/logger.js";
import redis from "../config/redis.js";

const isProd = process.env.NODE_ENV === 'production';

// ─── Cookie helpers ──────────────────────────────────────────────────────────

/** Set dual HttpOnly cookies: short-lived accessToken + long-lived refreshToken */
const setAuthCookies = (res, userId, role) => {
  const accessToken = generateAccessToken(userId, role);
  const refreshToken = generateRefreshToken(userId, role);

  const isProduction = process.env.NODE_ENV === "production";

  // Access token — short-lived (15 min default)
  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "strict",
    maxAge: 15 * 60 * 1000 // 15 minutes
  });

  // Refresh token — long-lived (7 day default), restricted path
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "strict",
    path: "/api/auth/refresh", // Only sent to refresh endpoint
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });

  // Backward compat: Also set legacy "token" cookie so any
  // code still checking req.cookies.token continues to work
  // during the migration period.
  res.cookie("token", accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "strict",
    maxAge: 15 * 60 * 1000
  });
};

/** Clear all auth cookies on logout */
const clearAuthCookies = (res) => {
  const opts = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    expires: new Date(0)
  };
  res.cookie("accessToken", "", opts);
  res.cookie("refreshToken", "", { ...opts, path: "/api/auth/refresh" });
  res.cookie("token", "", opts); // Legacy
};

// ─── Auth endpoints ──────────────────────────────────────────────────────────

export const registerUser = async (req, res) => {
  try {
    const { name, email, password, phone, address } = req.body;
    logger.info("Registration attempt", { name, email });

    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: "User already exists" });

    const user = await User.create({ name, email, password, phone, address });

    sendWelcomeEmail(user).catch(err =>
      logger.error("Welcome email failed:", err.message)
    );

    setAuthCookies(res, user._id, user.role);

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    });
  } catch (error) {
    logger.error("Registration error:", error);
    res.status(500).json({ message: "Registration failed", error: isProd ? 'An error occurred' : error.message });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select("+twoFactorSecret");

    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const match = await user.matchPassword(password);
    if (!match) return res.status(400).json({ message: "Invalid credentials" });

    // UPGRADE 2: Admin 2FA — if admin has 2FA enabled, issue a short-lived
    // pending2FAToken and return 206 rather than full auth cookies.
    if (user.role === "admin" && user.twoFactorEnabled) {
      const pending2FAToken = jwt.sign(
        { userId: user._id.toString(), pending2FA: true },
        process.env.ACCESS_TOKEN_SECRET || process.env.JWT_SECRET,
        { expiresIn: "5m" }
      );

      const isProduction = process.env.NODE_ENV === "production";
      res.cookie("pending2FAToken", pending2FAToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: "strict",
        maxAge: 5 * 60 * 1000 // 5 minutes
      });

      return res.status(206).json({
        requiresTwoFactor: true,
        message: "2FA verification required"
      });
    }

    setAuthCookies(res, user._id, user.role);

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    });
  } catch (error) {
    logger.error("Login error:", error);
    res.status(500).json({ message: "Login failed", error: isProd ? 'An error occurred' : error.message });
  }
};

export const logoutUser = async (req, res) => {
  // UPGRADE 1: Blacklist the accessToken in Redis so it can't be reused within
  // its remaining validity window even if an attacker captured it before logout.
  try {
    const accessToken = req.cookies?.accessToken || req.cookies?.token;
    if (accessToken && redis) {
      const decoded = jwt.decode(accessToken); // decode WITHOUT verifying
      if (decoded && decoded.exp) {
        const ttl = decoded.exp - Math.floor(Date.now() / 1000);
        if (ttl > 0) {
          await redis.setex(`blacklist:${accessToken}`, ttl, "1");
          logger.info("Access token blacklisted on logout", { ttl });
        }
      }
    }
  } catch (redisErr) {
    // Redis failure MUST NOT prevent logout
    logger.warn("Redis blacklist write failed (non-fatal):", redisErr.message);
  }

  clearAuthCookies(res);
  res.json({ message: "Logged out successfully" });
};

// ─── Refresh endpoint ────────────────────────────────────────────────────────

/**
 * POST /api/auth/refresh
 * Verifies the refresh-token cookie and issues a new access-token cookie.
 * The frontend interceptor calls this automatically on 401 + TOKEN_EXPIRED.
 */
export const refreshAccessToken = async (req, res) => {
  const refreshToken = req.cookies?.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({
      message: "No refresh token",
      code: "REFRESH_MISSING"
    });
  }

  try {
    const decoded = jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET
    );

    // Verify user still exists and is active
    const user = await User.findById(decoded.id).select("role isActive");
    if (!user) {
      return res.status(401).json({ message: "User not found", code: "REFRESH_INVALID" });
    }
    if (user.isActive === false) {
      return res.status(401).json({ message: "Account suspended", code: "REFRESH_INVALID" });
    }

    // Issue new access token only (refresh token stays the same until it expires)
    const newAccessToken = generateAccessToken(user._id, user.role);
    const isProduction = process.env.NODE_ENV === "production";

    res.cookie("accessToken", newAccessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "strict",
      maxAge: 15 * 60 * 1000
    });

    // Update legacy cookie too
    res.cookie("token", newAccessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "strict",
      maxAge: 15 * 60 * 1000
    });

    res.json({ message: "Token refreshed" });
  } catch (error) {
    logger.error("Refresh token error:", error.message);
    return res.status(401).json({
      message: "Invalid refresh token",
      code: "REFRESH_INVALID"
    });
  }
};

// ─── Profile ─────────────────────────────────────────────────────────────────

// FIX-11: Exclude sensitive fields (otp, resetPasswordToken, twoFactorSecret) from profile response
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password -otp -resetPasswordToken -resetPasswordExpires -twoFactorSecret');
    res.json(user);
  } catch (error) {
    logger.error("Get profile error:", error);
    res.status(500).json({ message: "Failed to fetch profile", error: isProd ? 'An error occurred' : error.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { name, phone, address } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, phone, address },
      { new: true, runValidators: true }
    ).select("-password");

    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ message: "Profile updated successfully", user });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) return res.status(401).json({ message: "Current password is incorrect" });

    user.password = newPassword;
    await user.save();

    res.json({ message: "Password changed successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// ─── Forgot / Reset Password ────────────────────────────────────────────────

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    // Always return 200 to prevent user enumeration attacks
    if (!user) {
      return res.status(200).json({
        message: "If that email is registered, a reset link has been sent."
      });
    }

    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 1 hour
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/reset-password/${rawToken}`;

    sendPasswordResetEmail(user, resetUrl).catch(err =>
      logger.error("Password reset email failed:", err.message)
    );

    logger.info("Password reset requested", { email });

    res.status(200).json({
      message: "If that email is registered, a reset link has been sent."
    });
  } catch (error) {
    logger.error("Forgot password error:", error);
    res.status(500).json({ message: "Failed to process request" });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired reset token" });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    logger.info(`Password reset successful for ${user.email}`);

    res.status(200).json({ message: "Password reset successful. You can now log in." });
  } catch (error) {
    logger.error("Reset password error:", error);
    res.status(500).json({ message: "Failed to reset password" });
  }
};
