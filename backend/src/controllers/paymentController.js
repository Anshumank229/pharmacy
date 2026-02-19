// src/controllers/paymentController.js
import Razorpay from "razorpay";
import crypto from "crypto";                    // ← Added for signature verification
import Order from "../models/Order.js";

// ==============================
// SAFE RAZORPAY INITIALIZATION
// ==============================
let razorpay;

if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
  console.log("Razorpay initialized successfully.");
} else {
  console.log("Warning: Razorpay keys missing — payment routes disabled.");
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
    console.error("Razorpay order creation error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create Razorpay order",
      error: error.message,
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

    // Compare signatures
    if (expectedSignature !== signature) {
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
    console.error("Payment verification error:", error);
    res.status(500).json({
      success: false,
      message: "Payment verification failed",
      error: error.message,
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
      'paymentStatus razorpayOrderId razorpayPaymentId paymentVerifiedAt'
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // FIX: Ownership check
    if (order.user.toString() !== req.user._id.toString() && !req.user.isAdmin) {
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
    console.error("Payment status error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch payment status",
      error: error.message,
    });
  }
};

// ==============================
// HANDLE PAYMENT FAILURE
// ==============================
export const handlePaymentFailure = async (req, res) => {
  try {
    const { orderId, errorCode, errorDescription } = req.body;

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // FIX: Ownership check
    if (order.user.toString() !== req.user._id.toString() && !req.user.isAdmin) {
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
    console.error("Payment failure handling error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to handle payment failure",
      error: error.message,
    });
  }
};

// ==============================
// REFUND PAYMENT (ADMIN ONLY)
// ==============================
export const refundPayment = async (req, res) => {
  try {
    // Check if admin
    if (!req.user.isAdmin) {
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
    console.error("Refund error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to process refund",
      error: error.message,
    });
  }
};