// src/routes/paymentRoutes.js
import express from "express";
import { protect, adminOnly } from "../middleware/authMiddleware.js";
import {
  createRazorpayOrder,
  verifyPayment,
  getPaymentStatus,       // FIX C5: was unregistered
  handlePaymentFailure,   // FIX C5: was unregistered
  refundPayment           // FIX C5: was unregistered
} from "../controllers/paymentController.js";
import { handleRazorpayWebhook } from "../controllers/webhookController.js";

const router = express.Router();

// ── FIX-3: Webhook MUST be registered first, before any express.json() parsing, 
// because it needs the raw request body for HMAC verification.
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  handleRazorpayWebhook
);

router.post("/create-order", protect, createRazorpayOrder);
router.post("/verify", protect, verifyPayment);

// FIX C5: Previously missing routes — now registered
router.get("/:orderId/status", protect, getPaymentStatus);
router.post("/:orderId/failure", protect, handlePaymentFailure);
router.post("/:orderId/refund", protect, adminOnly, refundPayment); // admin only

export default router;