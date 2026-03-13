import express from "express";
import { body } from "express-validator";
import { validate } from "../middleware/validate.js";
import User from "../models/User.js";
import { sendOTPEmail } from "../services/emailService.js";
import { sendWhatsAppOTP, sendSMSOTP } from "../services/whatsappService.js";
import { generateAccessToken, generateRefreshToken } from "../utils/generateToken.js";
import logger from '../utils/logger.js';
// M2: Stricter rate limit on OTP endpoints
import { authLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();

// Generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP to email
router.post(
  "/send-email",
  authLimiter,   // M2: 10 req/15 min
  [
    body("email").isEmail().withMessage("Valid email required"),
    body("name").optional().trim()
  ],
  validate,
  async (req, res) => {
    try {
      const { email, name } = req.body;

      // Check if email already exists and is verified
      const existingUser = await User.findOne({ email });
      if (existingUser && existingUser.isEmailVerified) {
        return res.status(400).json({
          message: "Email already registered and verified"
        });
      }

      // Generate OTP
      const otp = generateOTP();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Find or create user
      let user = await User.findOne({ email });
      if (user) {
        user.otp = { code: otp, expiresAt, type: 'email' };
      } else {
        user = new User({
          name: name || email.split('@')[0],
          email,
          otp: { code: otp, expiresAt, type: 'email' }
        });
      }
      await user.save();

      // Send OTP via email
      await sendOTPEmail(email, user.name, otp);

      res.json({
        success: true,
        message: "OTP sent to your email",
        expiresIn: 600 // seconds
      });
    } catch (error) {
      logger.error("Send email OTP error:", error);
      res.status(500).json({ message: "Failed to send OTP" });
    }
  }
);

// Send OTP to phone
router.post(
  "/send-phone",
  authLimiter,   // M2: 10 req/15 min
  [
    body("phone").matches(/^\d{10}$/).withMessage("Valid 10-digit phone required"),
    body("method").optional().isIn(['whatsapp', 'sms']).default('whatsapp'),
    body("name").optional().trim()
  ],
  validate,
  async (req, res) => {
    try {
      const { phone, name, method = 'whatsapp' } = req.body;

      // Check if phone already exists and is verified
      const existingUser = await User.findOne({ phone });
      if (existingUser && existingUser.isPhoneVerified) {
        return res.status(400).json({
          message: "Phone number already registered and verified"
        });
      }

      // Generate OTP
      const otp = generateOTP();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

      // Find or create user
      let user = await User.findOne({ phone });
      if (user) {
        user.otp = { code: otp, expiresAt, type: 'phone' };
      } else {
        user = new User({
          name: name || `User${phone.slice(-4)}`,
          phone,
          otp: { code: otp, expiresAt, type: 'phone' }
        });
      }
      await user.save();

      // Send OTP via chosen method
      let result;
      if (method === 'whatsapp') {
        result = await sendWhatsAppOTP(phone, otp);
      } else {
        result = await sendSMSOTP(phone, otp);
      }

      if (!result.success) {
        return res.status(500).json({ message: result.error });
      }

      res.json({
        success: true,
        message: `OTP sent via ${method}`,
        expiresIn: 600
      });
    } catch (error) {
      logger.error("Send phone OTP error:", error);
      res.status(500).json({ message: "Failed to send OTP" });
    }
  }
);

// Verify OTP
router.post(
  "/verify",
  authLimiter,   // M2: 10 req/15 min
  [
    body("otp").matches(/^\d{6}$/).withMessage("Valid 6-digit OTP required"),
    body("email").optional().isEmail(),
    body("phone").optional().matches(/^\d{10}$/)
  ],
  validate,
  async (req, res) => {
    try {
      const { email, phone, otp } = req.body;

      let user;
      if (email) {
        user = await User.findOne({ email });
      } else if (phone) {
        user = await User.findOne({ phone });
      } else {
        return res.status(400).json({ message: "Email or phone required" });
      }

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check OTP
      if (!user.otp || user.otp.code !== otp) {
        return res.status(400).json({ message: "Invalid OTP" });
      }

      if (new Date() > user.otp.expiresAt) {
        return res.status(400).json({ message: "OTP expired" });
      }

      // Mark as verified
      if (email) {
        user.isEmailVerified = true;
        user.email = email; // Ensure email is set
      } else if (phone) {
        user.isPhoneVerified = true;
        user.phone = phone;
      }

      // Clear OTP
      user.otp = undefined;
      await user.save();

      // Set dual auth cookies
      const isProduction = process.env.NODE_ENV === "production";
      const accessToken = generateAccessToken(user._id, user.role);
      const refreshToken = generateRefreshToken(user._id, user.role);

      res.cookie("accessToken", accessToken, {
        httpOnly: true, secure: isProduction, sameSite: "strict",
        maxAge: 15 * 60 * 1000
      });
      res.cookie("refreshToken", refreshToken, {
        httpOnly: true, secure: isProduction, sameSite: "strict",
        path: "/api/auth/refresh",
        maxAge: 7 * 24 * 60 * 60 * 1000
      });
      res.cookie("token", accessToken, {
        httpOnly: true, secure: isProduction, sameSite: "strict",
        maxAge: 15 * 60 * 1000
      });

      res.json({
        success: true,
        message: "OTP verified successfully",
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          isEmailVerified: user.isEmailVerified,
          isPhoneVerified: user.isPhoneVerified
        }
      });
    } catch (error) {
      logger.error("OTP verification error:", error);
      res.status(500).json({ message: "Verification failed" });
    }
  }
);

// Resend OTP
router.post(
  "/resend",
  authLimiter,   // M2: 10 req/15 min
  [
    body("email").optional().isEmail(),
    body("phone").optional().matches(/^\d{10}$/)
  ],
  validate,
  async (req, res) => {
    try {
      const { email, phone } = req.body;

      const query = email ? { email } : { phone };
      const user = await User.findOne(query);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Generate new OTP
      const otp = generateOTP();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

      user.otp = {
        code: otp,
        expiresAt,
        type: email ? 'email' : 'phone'
      };
      await user.save();

      // Resend OTP
      if (email) {
        await sendOTPEmail(email, user.name, otp);
      } else {
        // Default to WhatsApp for resend
        await sendWhatsAppOTP(phone, otp);
      }

      res.json({
        success: true,
        message: "OTP resent successfully",
        expiresIn: 600
      });
    } catch (error) {
      logger.error("Resend OTP error:", error);
      res.status(500).json({ message: "Failed to resend OTP" });
    }
  }
);

export default router;