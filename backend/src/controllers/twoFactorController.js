// src/controllers/twoFactorController.js
// UPGRADE 2: Admin TOTP-based Two-Factor Authentication
// Uses speakeasy for TOTP generation/verification and qrcode for QR images.

import speakeasy from "speakeasy";
import qrcode from "qrcode";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import logger from "../utils/logger.js";
import { generateAccessToken, generateRefreshToken } from "../utils/generateToken.js";

// ─── Cookie helper (mirrors authController) ──────────────────────────────────
const setAuthCookies = (res, userId, role) => {
    const accessToken = generateAccessToken(userId, role);
    const refreshToken = generateRefreshToken(userId, role);
    const isProduction = process.env.NODE_ENV === "production";

    res.cookie("accessToken", accessToken, {
        httpOnly: true, secure: isProduction, sameSite: "strict",
        maxAge: 15 * 60 * 1000
    });
    res.cookie("refreshToken", refreshToken, {
        httpOnly: true, secure: isProduction, sameSite: "strict",
        path: "/api/auth/refresh", maxAge: 7 * 24 * 60 * 60 * 1000
    });
    res.cookie("token", accessToken, {
        httpOnly: true, secure: isProduction, sameSite: "strict",
        maxAge: 15 * 60 * 1000
    });
};

// ─── Setup 2FA ───────────────────────────────────────────────────────────────
/**
 * POST /api/2fa/setup
 * Generates a TOTP secret and QR code for the admin to scan.
 * The secret is saved (but 2FA is NOT yet enabled) until verify-setup succeeds.
 */
export const setup2FA = async (req, res) => {
    try {
        const secret = speakeasy.generateSecret({
            name: `MedStore (${req.user.email})`,
            length: 20
        });

        // Save secret on user — 2FA stays disabled until verify-setup
        await User.findByIdAndUpdate(req.user._id, {
            twoFactorSecret: secret.base32
        });

        // Generate scannable QR code as data URL
        const qrCode = await qrcode.toDataURL(secret.otpauth_url);

        logger.info("2FA setup initiated", { userId: req.user._id });

        res.json({
            message: "Scan the QR code with Google Authenticator or Authy",
            qrCode,          // base64 PNG — render as <img src={qrCode} />
            secret: secret.base32  // Manual entry fallback
        });
    } catch (error) {
        logger.error("2FA setup error:", error);
        res.status(500).json({ message: "Failed to setup 2FA" });
    }
};

// ─── Verify 2FA Setup ─────────────────────────────────────────────────────────
/**
 * POST /api/2fa/verify-setup
 * Body: { token }  — 6-digit code from authenticator app
 * Verifies the TOTP; if valid, enables 2FA for the account.
 */
export const verify2FASetup = async (req, res) => {
    try {
        const { token } = req.body;
        if (!token) return res.status(400).json({ message: "Token is required" });

        // Must load twoFactorSecret via +select
        const user = await User.findById(req.user._id).select("+twoFactorSecret");
        if (!user || !user.twoFactorSecret) {
            return res.status(400).json({ message: "2FA setup not initiated. Call /api/2fa/setup first." });
        }

        const isValid = speakeasy.totp.verify({
            secret: user.twoFactorSecret,
            encoding: "base32",
            token,
            window: 1  // Allow ±30 second clock drift
        });

        if (!isValid) {
            return res.status(401).json({ message: "Invalid verification code. Please try again." });
        }

        user.twoFactorEnabled = true;
        await user.save();

        logger.info("2FA enabled", { userId: user._id });
        res.json({ message: "2FA enabled successfully. Future admin logins will require a 6-digit code." });
    } catch (error) {
        logger.error("2FA verify-setup error:", error);
        res.status(500).json({ message: "Failed to verify 2FA setup" });
    }
};

// ─── Disable 2FA ─────────────────────────────────────────────────────────────
/**
 * POST /api/2fa/disable
 * Body: { password }  — current account password for confirmation
 * Verifies password, then disables 2FA and clears the secret.
 */
export const disable2FA = async (req, res) => {
    try {
        const { password } = req.body;
        if (!password) return res.status(400).json({ message: "Current password is required" });

        const user = await User.findById(req.user._id).select("+twoFactorSecret");
        if (!user) return res.status(404).json({ message: "User not found" });

        const isMatch = await user.matchPassword(password);
        if (!isMatch) return res.status(401).json({ message: "Incorrect password" });

        user.twoFactorEnabled = false;
        user.twoFactorSecret = undefined;
        await user.save();

        logger.info("2FA disabled", { userId: user._id });
        res.json({ message: "2FA has been disabled." });
    } catch (error) {
        logger.error("2FA disable error:", error);
        res.status(500).json({ message: "Failed to disable 2FA" });
    }
};

// ─── Verify Login 2FA ─────────────────────────────────────────────────────────
/**
 * POST /api/2fa/login
 * Body: { token }  — 6-digit TOTP code
 * Reads pending2FAToken cookie (set during login step 1), verifies TOTP,
 * then issues full auth cookies and returns user data.
 * No protect middleware — the pending2FAToken IS the auth mechanism here.
 */
export const verifyLogin2FA = async (req, res) => {
    try {
        const pendingToken = req.cookies?.pending2FAToken;
        if (!pendingToken) {
            return res.status(401).json({ message: "No pending 2FA session. Please login again." });
        }

        const { token } = req.body;
        if (!token) return res.status(400).json({ message: "2FA token is required" });

        // Verify the pending JWT
        let decoded;
        try {
            decoded = jwt.verify(
                pendingToken,
                process.env.ACCESS_TOKEN_SECRET || process.env.JWT_SECRET
            );
        } catch (err) {
            return res.status(401).json({ message: "2FA session expired. Please login again." });
        }

        if (!decoded.pending2FA) {
            return res.status(401).json({ message: "Invalid 2FA session." });
        }

        // Load user with secret
        const user = await User.findById(decoded.userId).select("+twoFactorSecret -password");
        if (!user) return res.status(401).json({ message: "User not found" });

        // Verify TOTP
        const isValid = speakeasy.totp.verify({
            secret: user.twoFactorSecret,
            encoding: "base32",
            token,
            window: 1
        });

        if (!isValid) {
            logger.warn("Invalid 2FA code on login", { userId: user._id });
            return res.status(401).json({ message: "Invalid 2FA code. Please try again." });
        }

        // Clear the pending cookie
        const isProduction = process.env.NODE_ENV === "production";
        res.cookie("pending2FAToken", "", {
            httpOnly: true,
            secure: isProduction,
            sameSite: "strict",
            expires: new Date(0)
        });

        // Issue full auth cookies — same as normal login
        setAuthCookies(res, user._id, user.role);

        logger.info("2FA login successful", { userId: user._id });

        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role
        });
    } catch (error) {
        logger.error("2FA login error:", error);
        res.status(500).json({ message: "2FA verification failed" });
    }
};

// ─── Generate Backup Codes (Bonus) ───────────────────────────────────────────
/**
 * POST /api/2fa/backup-codes
 * Generates 8 one-time backup codes, hashes them, and stores on the user.
 * Returns plain codes ONCE — they cannot be retrieved again.
 */
export const generate2FABackupCodes = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: "User not found" });
        if (!user.twoFactorEnabled) {
            return res.status(400).json({ message: "2FA must be enabled before generating backup codes." });
        }

        // Generate 8 random 8-character alphanumeric codes
        const plainCodes = Array.from({ length: 8 }, () =>
            crypto.randomBytes(4).toString("hex").toUpperCase() // e.g. "A1B2C3D4"
        );

        // Hash each code for storage — same principle as password hashing
        const salt = await bcrypt.genSalt(10);
        const hashedCodes = await Promise.all(
            plainCodes.map(code => bcrypt.hash(code, salt))
        );

        // Store hashed codes on user (overwriting any previous batch)
        await User.findByIdAndUpdate(req.user._id, {
            backupCodes: hashedCodes.map(hash => ({ code: hash, used: false }))
        });

        logger.info("2FA backup codes generated", { userId: user._id, count: 8 });

        res.json({
            message: "Save these codes in a secure location. They will NOT be shown again.",
            backupCodes: plainCodes  // Plain codes shown ONCE only
        });
    } catch (error) {
        logger.error("Backup codes generation error:", error);
        res.status(500).json({ message: "Failed to generate backup codes" });
    }
};
