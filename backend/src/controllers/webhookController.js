// src/controllers/webhookController.js
// FIX-3: Razorpay webhook handler
// Receives payment events from Razorpay and marks orders as paid server-side.
// This is the safety net for when the frontend verification call fails
// (browser crash, network timeout, tab close after payment succeeds).

import crypto from "crypto";
import Order from "../models/Order.js";
import Medicine from "../models/Medicine.js";
import logger from "../utils/logger.js";

// ==============================
// RAZORPAY WEBHOOK
// ==============================
// Route must use express.raw({ type: 'application/json' }) middleware
// so that req.body is a raw Buffer for signature verification.
// Registered in paymentRoutes.js BEFORE express.json() is applied.

export const handleRazorpayWebhook = async (req, res) => {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!secret) {
        logger.error("RAZORPAY_WEBHOOK_SECRET is not configured — webhook rejected");
        return res.status(500).json({ message: "Webhook not configured" });
    }

    // ── 1. Verify signature ───────────────────────────────────────────────────
    const signature = req.headers["x-razorpay-signature"];

    if (!signature) {
        logger.warn("Webhook received without X-Razorpay-Signature header");
        return res.status(400).json({ message: "Missing signature" });
    }

    const expectedSignature = crypto
        .createHmac("sha256", secret)
        .update(req.body) // req.body is the raw Buffer
        .digest("hex");

    let isValid = false;
    try {
        const expBuf = Buffer.from(expectedSignature, "hex");
        const recBuf = Buffer.from(signature, "hex");
        isValid =
            expBuf.length === recBuf.length &&
            crypto.timingSafeEqual(expBuf, recBuf);
    } catch {
        isValid = false;
    }

    if (!isValid) {
        logger.warn("Webhook signature verification FAILED — possible spoofed request", {
            receivedSignature: signature.slice(0, 12) + "..."
        });
        return res.status(400).json({ message: "Invalid signature" });
    }

    // ── 2. Acknowledge immediately — Razorpay requires a fast 200 ─────────────
    res.status(200).json({ received: true });

    // ── 3. Process event asynchronously ──────────────────────────────────────
    try {
        const payload = JSON.parse(req.body.toString());
        const event = payload.event;

        logger.info(`Razorpay webhook event received: ${event}`);

        if (event === "payment.captured") {
            await handlePaymentCaptured(payload);
        } else if (event === "payment.failed") {
            await handlePaymentFailed(payload);
        } else {
            logger.info(`Unhandled webhook event: ${event}`);
        }
    } catch (err) {
        // Don't re-send a response — we already sent 200 above.
        logger.error("Webhook processing error (post-ack):", err.message);
    }
};

// ── Event: payment.captured ───────────────────────────────────────────────────
async function handlePaymentCaptured(payload) {
    const payment = payload.payload?.payment?.entity;
    if (!payment) return;

    const razorpayOrderId = payment.order_id;
    const razorpayPaymentId = payment.id;

    if (!razorpayOrderId) {
        logger.warn("Webhook payment.captured missing order_id");
        return;
    }

    // Find order by razorpayOrderId
    const order = await Order.findOne({ razorpayOrderId }).populate("items.medicine");

    if (!order) {
        logger.warn(`Webhook: no order found for razorpayOrderId=${razorpayOrderId}`);
        return;
    }

    // Idempotency guard — if already paid, skip
    if (order.paymentStatus === "paid") {
        logger.info(`Webhook: order ${order._id} already marked paid — skipping`);
        return;
    }

    // ── Mark order as paid ────────────────────────────────────────────────────
    order.paymentStatus = "paid";
    order.orderStatus = "processing";
    order.razorpayPaymentId = razorpayPaymentId;
    order.paymentVerifiedAt = new Date();
    await order.save();

    logger.info(`Webhook: order ${order._id} marked PAID via payment.captured event`, {
        razorpayOrderId,
        razorpayPaymentId
    });
}

// ── Event: payment.failed ─────────────────────────────────────────────────────
async function handlePaymentFailed(payload) {
    const payment = payload.payload?.payment?.entity;
    if (!payment) return;

    const razorpayOrderId = payment.order_id;
    if (!razorpayOrderId) return;

    const order = await Order.findOne({ razorpayOrderId });
    if (!order) return;

    // Only update if not already paid (don't overwrite a paid order)
    if (order.paymentStatus !== "paid") {
        order.paymentStatus = "failed";
        await order.save();
        logger.info(`Webhook: order ${order._id} marked FAILED`, {
            errorCode: payment.error_code,
            errorDescription: payment.error_description
        });
    }
}
