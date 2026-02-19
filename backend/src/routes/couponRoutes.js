import express from "express";
import { body } from "express-validator";
import { protect, adminOnly } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validate.js";
import {
  createCoupon,
  getCoupons,
  deleteCoupon,
  validateCoupon
} from "../controllers/couponController.js";

const router = express.Router();

// =====================================================
// USER ROUTES
// =====================================================
router.post("/validate", protect, validateCoupon);

// =====================================================
// ADMIN ROUTES
// =====================================================
router.post(
  "/",
  protect,
  adminOnly,
  [
    body("code")
      .notEmpty().withMessage("Coupon code is required")
      .isAlphanumeric().withMessage("Coupon code must be alphanumeric"),
    body("discountPercent")
      .isInt({ min: 1, max: 100 }).withMessage("Discount must be between 1 and 100"),
    body("minAmount")
      .isFloat({ min: 0 }).withMessage("Minimum amount must be non-negative"),
  ],
  validate,
  createCoupon
);

router.get("/", protect, adminOnly, getCoupons);
router.delete("/:id", protect, adminOnly, deleteCoupon);

export default router;
