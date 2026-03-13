import express from "express";
import User from "../models/User.js";
import { generateAccessToken, generateRefreshToken } from "../utils/generateToken.js";
import logger from "../utils/logger.js";

const router = express.Router();

// Google OAuth callback (for client-side token verification)
router.post("/callback", async (req, res) => {
  try {
    const { idToken, name, email, googleId, photoUrl } = req.body;

    // Find or create user
    let user = await User.findOne({
      $or: [{ email }, { googleId }]
    });

    if (!user) {
      // Create new user
      user = new User({
        name: name,
        email: email,
        googleId: googleId,
        avatar: photoUrl,
        isEmailVerified: true
      });
      await user.save();
    } else if (!user.googleId) {
      // Link Google account to existing user
      user.googleId = googleId;
      user.avatar = photoUrl || user.avatar;
      user.isEmailVerified = true;
      await user.save();
    }

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
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        isEmailVerified: user.isEmailVerified
      }
    });
  } catch (error) {
    logger.error('Google auth error:', error);
    res.status(401).json({
      success: false,
      message: 'Google authentication failed'
    });
  }
});

export default router;