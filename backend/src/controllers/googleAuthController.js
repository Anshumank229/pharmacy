import User from "../models/User.js";
import { generateAccessToken, generateRefreshToken } from "../utils/generateToken.js";
import logger from "../utils/logger.js";

export const googleAuth = async (req, res) => {
  try {
    const { idToken, name, email, googleId } = req.body;

    // Check if user exists
    let user = await User.findOne({
      $or: [{ email }, { googleId }]
    });

    if (!user) {
      // Create new user with Google
      user = new User({
        name,
        email,
        googleId,
        isEmailVerified: true,
        avatar: req.body.photoUrl
      });
      await user.save();
    } else if (!user.googleId) {
      // Link Google account to existing user
      user.googleId = googleId;
      user.isEmailVerified = true;
      await user.save();
    }

    // Set dual auth cookies (same pattern as authController)
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
        avatar: user.avatar
      }
    });
  } catch (error) {
    logger.error("Google auth error:", error);
    res.status(500).json({ message: "Authentication failed" });
  }
};