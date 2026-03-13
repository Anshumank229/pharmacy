// src/controllers/paymentController.js
import Razorpay from "razorpay";
import crypto from "crypto";
import Order from "../models/Order.js";
import logger from "../utils/logger.js";

const isProd = process.env.NODE_ENV === 'production';

// ==============================
// SAFE RAZORPAY INITIALIZATION
// ==============================
let razorpay;

if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
  logger.info("Razorpay initialized successfully.");
} else {
  logger.warn("Razorpay keys missing — payment routes disabled.");
}

// ==============================
// CREATE RAZORPAY ORDER
// ==============================
export const createRazorpayOrder = async (req, res) => {
  try {
    if (!razorpay) {
      return res.status(503).json({
        success: false,
        message: "Razorpay is not configured. Please add keys in .env",
      });
    }

    const { amount, orderId } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid amount is required",
      });
    }

    // FIX: Verify that the order belongs to the user
    if (orderId) {
      const existingOrder = await Order.findById(orderId);
      if (!existingOrder) {
        return res.status(404).json({
          success: false,
          message: "Order not found",
        });
      }

      // CRITICAL FIX: Check ownership
      if (existingOrder.user.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: "Not authorized to create payment for this order",
        });
      }
    }

    const options = {
      amount: Math.round(amount * 100), // amount in paise
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

    // FIX: Store razorpay order ID in database if orderId provided
    if (orderId) {
      await Order.findByIdAndUpdate(orderId, {
        razorpayOrderId: order.id
      });
    }

    res.json({
      success: true,
      order,
    });
  } catch (error) {
    logger.error("Razorpay order creation error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create Razorpay order",
      error: isProd ? 'An error occurred' : error.message,
    });
  }
};

// ==============================
// VERIFY PAYMENT SIGNATURE
// ==============================
export const verifyPayment = async (req, res) => {
  try {
    const {
      order_id,         // Razorpay Order ID (e.g., order_xxx)
      payment_id,       // Razorpay Payment ID (e.g., pay_xxx)
      signature,        // Razorpay signature from frontend
      orderId,          // Your MongoDB Order _id
    } = req.body;

    // Validate required fields
    if (!order_id || !payment_id || !signature || !orderId) {
      return res.status(400).json({
        success: false,
        message: "Missing required payment verification fields",
      });
    }

    // FIX: CRITICAL - Verify order exists and belongs to user
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // CRITICAL FIX: Ownership check
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to verify payment for this order",
      });
    }

    // Check if already paid
    if (order.paymentStatus === 'paid') {
      return res.status(400).json({
        success: false,
        message: "Order already paid",
      });
    }

    // Generate expected signature
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${order_id}|${payment_id}`)
      .digest("hex");

    // FIX H11: Timing-safe comparison prevents HMAC side-channel attacks.
    // A simple !== comparison leaks timing info that lets an attacker guess
    // signature bytes one at a time. crypto.timingSafeEqual takes constant time.
    let isSignatureValid = false;
    try {
      const expectedBuf = Buffer.from(expectedSignature, "hex");
      const receivedBuf = Buffer.from(signature, "hex");
      isSignatureValid =
        expectedBuf.length === receivedBuf.length &&
        crypto.timingSafeEqual(expectedBuf, receivedBuf);
    } catch {
      isSignatureValid = false;
    }

    if (!isSignatureValid) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment signature",
      });
    }

    // Update order as paid
    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      {
        paymentStatus: "paid",
        razorpayOrderId: order_id,
        razorpayPaymentId: payment_id,
        razorpaySignature: signature,
        paymentVerifiedAt: new Date(),
      },
      { new: true }
    ).populate('user', 'name email');

    res.json({
      success: true,
      message: "Payment verified successfully",
      order: {
        _id: updatedOrder._id,
        orderStatus: updatedOrder.orderStatus,
        paymentStatus: updatedOrder.paymentStatus,
        totalAmount: updatedOrder.totalAmount
      },
    });
  } catch (error) {
    logger.error("Payment verification error:", error);
    res.status(500).json({
      success: false,
      message: "Payment verification failed",
      error: isProd ? 'An error occurred' : error.message,
    });
  }
};

// ==============================
// GET PAYMENT STATUS
// ==============================
export const getPaymentStatus = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId).select(
      // FIX C5: Added 'user' to select — ownership check (order.user.toString()) was
      // throwing TypeError because user was excluded from the projection.
      'user paymentStatus razorpayOrderId razorpayPaymentId paymentVerifiedAt'
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // FIX C4: Use role === 'admin' — isAdmin does not exist on User schema.
    if (order.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view this order",
      });
    }

    res.json({
      success: true,
      paymentStatus: order.paymentStatus,
      razorpayOrderId: order.razorpayOrderId,
      razorpayPaymentId: order.razorpayPaymentId,
      paymentVerifiedAt: order.paymentVerifiedAt,
    });
  } catch (error) {
    logger.error("Payment status error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch payment status",
      error: isProd ? 'An error occurred' : error.message,
    });
  }
};

// ==============================
// HANDLE PAYMENT FAILURE
// ==============================
export const handlePaymentFailure = async (req, res) => {
  try {
    // C1 FIX: orderId comes from route param /:orderId/failure, NOT from body
    const orderId = req.params.orderId;
    const { errorCode, errorDescription } = req.body;

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // FIX C4: Use role === 'admin' — isAdmin does not exist on User schema.
    if (order.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      });
    }

    // Update order with failure
    order.paymentStatus = "failed";
    order.paymentError = {
      code: errorCode,
      description: errorDescription,
      timestamp: new Date()
    };
    await order.save();

    res.json({
      success: true,
      message: "Payment failure recorded",
      orderId: order._id,
    });
  } catch (error) {
    logger.error("Payment failure handling error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to handle payment failure",
      error: isProd ? 'An error occurred' : error.message,
    });
  }
};

// ==============================
// REFUND PAYMENT (ADMIN ONLY)
// ==============================
export const refundPayment = async (req, res) => {
  try {
    // FIX C4: Use role === 'admin' — isAdmin does not exist on User schema.
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: "Admin access required",
      });
    }

    const { orderId } = req.params;
    const { amount } = req.body;

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (order.paymentStatus !== 'paid') {
      return res.status(400).json({
        success: false,
        message: "Order is not paid",
      });
    }

    if (!order.razorpayPaymentId) {
      return res.status(400).json({
        success: false,
        message: "No payment ID found for refund",
      });
    }

    if (!razorpay) {
      return res.status(503).json({
        success: false,
        message: "Razorpay not configured",
      });
    }

    // Process refund through Razorpay
    const refund = await razorpay.payments.refund(order.razorpayPaymentId, {
      amount: amount ? Math.round(amount * 100) : undefined, // Full refund if amount not specified
    });

    // Update order status
    order.paymentStatus = "refunded";
    order.refundDetails = {
      refundId: refund.id,
      amount: refund.amount / 100,
      createdAt: new Date()
    };
    await order.save();

    res.json({
      success: true,
      message: "Refund processed successfully",
      refund,
    });
  } catch (error) {
    logger.error("Refund error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to process refund",
      error: isProd ? 'An error occurred' : error.message,
    });
  }
};