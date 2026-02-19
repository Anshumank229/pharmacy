import express from "express";
import { body } from "express-validator";
import { protect, adminOnly } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validate.js";
import {
  createOrder,
  getMyOrders,
  getAllOrders,
  updateOrderStatus,
  cancelOrder
} from "../controllers/orderController.js";

const router = express.Router();

// ── User routes ───────────────────────────────────────────────────────────────
router.post(
  "/",
  protect,
  [
    body("shippingAddress").notEmpty().withMessage("Shipping address is required"),
    body("paymentMethod").notEmpty().withMessage("Payment method is required"),
  ],
  validate,
  createOrder
);

router.get("/my-orders", protect, getMyOrders);

// Cancel own order (must be "processing")
router.put("/:id/cancel", protect, cancelOrder);

// ── Admin routes ──────────────────────────────────────────────────────────────
router.get("/", protect, adminOnly, getAllOrders);
router.put("/:id/status", protect, adminOnly, updateOrderStatus);

export default router;
