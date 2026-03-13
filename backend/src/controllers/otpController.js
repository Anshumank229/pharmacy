import User from "../models/User.js";
import { sendOTPEmail } from "../services/emailService.js";
import { sendWhatsAppOTP, sendSMSOTP } from "../services/whatsappService.js";
import logger from "../utils/logger.js";

// Generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send Email OTP
export const sendEmailOTP = async (req, res) => {
  try {
    const { email, name } = req.body;

    // Check if email already exists
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
};

// Send Phone OTP
export const sendPhoneOTP = async (req, res) => {
  try {
    const { phone, name, method = 'whatsapp' } = req.body;

    // Validate phone number
    if (!/^\d{10}$/.test(phone)) {
      return res.status(400).json({ message: "Invalid phone number" });
    }

    // Check if phone already exists
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
};

// Verify OTP and Register/Login
export const verifyOTP = async (req, res) => {
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
    } else if (phone) {
      user.isPhoneVerified = true;
    }

    // Clear OTP
    user.otp = undefined;
    await user.save();

    // Generate JWT token (use your existing login logic)
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: "OTP verified successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
      }
    });
  } catch (error) {
    logger.error("OTP verification error:", error);
    res.status(500).json({ message: "Verification failed" });
  }
};

// Resend OTP
export const resendOTP = async (req, res) => {
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
};