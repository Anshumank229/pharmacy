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
    resetPassword
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validate.js";

const router = express.Router();

// ── Auth ──────────────────────────────────────────────────────────────────────
router.post(
    "/register",
    [
        body("name").notEmpty().withMessage("Name is required"),
        body("email").isEmail().withMessage("Valid email is required"),
        body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
    ],
    validate,
    registerUser
);

router.post(
    "/login",
    [
        body("email").isEmail().withMessage("Valid email is required"),
        body("password").notEmpty().withMessage("Password is required"),
    ],
    validate,
    loginUser
);

router.post("/logout", logoutUser);

// ── Profile ───────────────────────────────────────────────────────────────────
router.get("/me", protect, getProfile);
router.get("/profile", protect, getProfile);
router.put("/profile", protect, updateProfile);

router.put(
    "/change-password",
    protect,
    [
        body("currentPassword").notEmpty().withMessage("Current password is required"),
        body("newPassword").isLength({ min: 6 }).withMessage("New password must be at least 6 characters"),
    ],
    validate,
    changePassword
);

// ── Forgot / Reset Password ───────────────────────────────────────────────────
router.post(
    "/forgot-password",
    [body("email").isEmail().withMessage("Valid email is required")],
    validate,
    forgotPassword
);

router.post(
    "/reset-password/:token",
    [body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters")],
    validate,
    resetPassword
);

export default router;
