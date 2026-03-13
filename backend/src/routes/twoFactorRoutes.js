// src/routes/twoFactorRoutes.js
// UPGRADE 2: Admin Two-Factor Authentication routes

import express from "express";
import { protect, adminOnly } from "../middleware/authMiddleware.js";
import {
    setup2FA,
    verify2FASetup,
    disable2FA,
    verifyLogin2FA,
    generate2FABackupCodes
} from "../controllers/twoFactorController.js";

const router = express.Router();

// POST /api/2fa/login
// No auth middleware — authenticated via the pending2FAToken HttpOnly cookie
router.post("/login", verifyLogin2FA);

// All routes below require a valid admin session
router.post("/setup", protect, adminOnly, setup2FA);
router.post("/verify-setup", protect, adminOnly, verify2FASetup);
router.post("/disable", protect, adminOnly, disable2FA);
router.post("/backup-codes", protect, adminOnly, generate2FABackupCodes);

export default router;
