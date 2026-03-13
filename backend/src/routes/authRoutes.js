// src/routes/authRoutes.js
import express from "express";
import { body } from "express-validator";
import {
    registerUser,
    loginUser,
    logoutUser,
    getProfile,
    updateProfile,
    changePassword,
    forgotPassword,
    resetPassword,
    refreshAccessToken
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validate.js";
// M2: Import the stricter auth-specific rate limiter
// FIX: Import from rateLimiter.js instead of server.js
import { authLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();

// ── Auth ──────────────────────────────────────────────────────────────────────
// M3: Strengthened validation — name length, email normalisation, password complexity
router.post(
    "/register",
    authLimiter,   // M2: 10 req/15 min
    [
        body("name")
            .trim()
            .notEmpty().withMessage("Name is required")
            .isLength({ min: 2, max: 50 }).withMessage("Name must be 2–50 characters"),
        body("email")
            .normalizeEmail()
            .isEmail().withMessage("Valid email is required"),
        body("password")
            .isLength({ min: 8 }).withMessage("Password must be at least 8 characters")
            .matches(/[A-Z]/).withMessage("Password must contain at least one uppercase letter")
            .matches(/[a-z]/).withMessage("Password must contain at least one lowercase letter")
            .matches(/\d/).withMessage("Password must contain at least one number"),
    ],
    validate,
    registerUser
);

router.post(
    "/login",
    authLimiter,   // M2: 10 req/15 min
    [
        body("email")
            .normalizeEmail()
            .isEmail().withMessage("Valid email is required"),
        body("password")
            .notEmpty().withMessage("Password is required"),
    ],
    validate,
    loginUser
);

// JWT Refresh — called by the frontend interceptor when access token expires
// FIX-8: Apply authLimiter (10 req/15 min) to prevent refresh token hammering
router.post("/refresh", authLimiter, refreshAccessToken);

router.post("/logout", logoutUser);

// ── Profile ───────────────────────────────────────────────────────────────────
router.get("/me", protect, getProfile);
router.get("/profile", protect, getProfile);

// FIX-6: Add input validation to updateProfile
router.put(
    "/profile",
    protect,
    [
        body("name")
            .optional()
            .trim()
            .isLength({ min: 2, max: 50 }).withMessage("Name must be 2–50 characters")
            .not().matches(/<[^>]*>/).withMessage("Name cannot contain HTML tags"),
        body("phone")
            .optional()
            .matches(/^[0-9]{10}$/).withMessage("Phone must be a 10-digit number"),
        body("address")
            .optional()
            .isLength({ max: 500 }).withMessage("Address must be under 500 characters"),
    ],
    validate,
    updateProfile
);

router.put(
    "/change-password",
    protect,
    [
        body("currentPassword").notEmpty().withMessage("Current password is required"),
        body("newPassword")
            .isLength({ min: 8 }).withMessage("New password must be at least 8 characters")
            .matches(/[A-Z]/).withMessage("Must contain at least one uppercase letter")
            .matches(/[a-z]/).withMessage("Must contain at least one lowercase letter")
            .matches(/\d/).withMessage("Must contain at least one number"),
    ],
    validate,
    changePassword
);

// ── Forgot / Reset Password ───────────────────────────────────────────────────
router.post(
    "/forgot-password",
    authLimiter,   // M2: protect reset emails from enumeration/spam
    [body("email").normalizeEmail().isEmail().withMessage("Valid email is required")],
    validate,
    forgotPassword
);

router.post(
    "/reset-password/:token",
    [body("password").isLength({ min: 8 }).withMessage("Password must be at least 8 characters")],
    validate,
    resetPassword
);

export default router;