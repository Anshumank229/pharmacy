import mongoose from "mongoose";
import Order from "../models/Order.js";
import Cart from "../models/Cart.js";
import Medicine from "../models/Medicine.js";
import Coupon from "../models/Coupon.js";
import Prescription from "../models/Prescription.js";
import { sendOrderConfirmation, sendOrderStatusEmail } from "../services/emailService.js";
// M5: Structured logger — replaces console.log/error
import logger from "../utils/logger.js";

const isProd = process.env.NODE_ENV === 'production';

// ==========================
// VALIDATE PRESCRIPTIONS FOR ORDER
// ==========================
const validatePrescriptionsForOrder = async (userId, cartItems) => {
  // Get all medicine IDs from the cart
  const medicineIds = cartItems.map(item => item.medicine._id);

  // Find which medicines require prescription
  const prescriptionMedicines = await Medicine.find({
    _id: { $in: medicineIds },
    requiresPrescription: true
  });

  // If no prescription medicines, return true
  if (prescriptionMedicines.length === 0) {
    return true;
  }

  // Check if user has any approved prescriptions
  const approvedPrescriptions = await Prescription.find({
    user: userId,
    status: 'approved'
  });

  if (approvedPrescriptions.length === 0) {
    throw new Error(
      'This order contains medicines that require a valid prescription. ' +
      'Please upload your prescription and wait for approval.'
    );
  }

  return true;
};

// ==========================
// CREATE ORDER (COD or Razorpay Pending)
// ==========================
export const createOrder = async (req, res) => {
  try {
    const { shippingAddress, paymentMethod, couponCode } = req.body;

    logger.info("Creating order", { userId: req.user._id, couponCode: couponCode || "none" });

    // STEP 1: FETCH USER'S CART
    let cart = await Cart.findOne({ user: req.user._id }).populate("items.medicine");
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    // STEP 2: VALIDATE PRESCRIPTIONS
    try {
      await validatePrescriptionsForOrder(req.user._id, cart.items);
    } catch (prescriptionError) {
      return res.status(400).json({
        message: prescriptionError.message,
        requiresPrescription: true
      });
    }

    // STEP 3: VALIDATE STOCK
    for (const item of cart.items) {
      if (!item.medicine) {
        return res.status(400).json({ message: "Invalid medicine in cart. Please refresh and try again." });
      }
      if (item.medicine.stock < item.quantity) {
        return res.status(400).json({
          message: `Insufficient stock for ${item.medicine.name}. Available: ${item.medicine.stock}, Requested: ${item.quantity}`,
        });
      }
    }

    // STEP 4: CALCULATE TOTAL
    const subtotal = cart.items.reduce((sum, item) => sum + item.medicine.price * item.quantity, 0);
    const deliveryCharge = 0; // Free delivery
    let totalAmount = subtotal;
    let appliedCoupon = null;
    let discountAmount = 0;

    // STEP 5: APPLY COUPON (UPGRADE 3 — full rule enforcement)
    if (couponCode) {
      // Pre-populate cart items' medicine objects for category/product checks
      const orderItemsForCheck = cart.items; // items already populated

      const coupon = await Coupon.findOne({ code: couponCode.toUpperCase() });

      // CHECK 1 — Basic validity
      if (!coupon) {
        return res.status(400).json({ message: "Invalid coupon code" });
      }
      if (!coupon.isActive) {
        return res.status(400).json({ message: "Coupon is not active" });
      }
      if (coupon.validUntil && coupon.validUntil < Date.now()) {
        return res.status(400).json({ message: "Coupon has expired" });
      }
      if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
        return res.status(400).json({ message: "Coupon usage limit reached" });
      }
      if (totalAmount < coupon.minOrderAmount) {
        return res.status(400).json({
          message: `Minimum order amount of ₹${coupon.minOrderAmount} required for this coupon`
        });
      }

      // CHECK 2 — First time only
      if (coupon.firstTimeOnly) {
        const previousOrders = await Order.countDocuments({
          user: req.user._id,
          status: { $ne: "cancelled" }
        });
        if (previousOrders > 0) {
          return res.status(400).json({ message: "This coupon is for first-time orders only" });
        }
      }

      // CHECK 3 — User specific
      if (coupon.userSpecific && coupon.applicableUsers.length > 0) {
        const isAllowed = coupon.applicableUsers
          .some(id => id.toString() === req.user._id.toString());
        if (!isAllowed) {
          return res.status(400).json({ message: "This coupon is not valid for your account" });
        }
      }

      // CHECK 4 — Per user usage limit
      const perUserLimit = coupon.perUserLimit ?? 1;
      const userUsageCount = coupon.usedBy
        ? coupon.usedBy.filter(entry => entry.user.toString() === req.user._id.toString()).length
        : 0;
      if (userUsageCount >= perUserLimit) {
        return res.status(400).json({
          message: `You have already used this coupon the maximum number of times (${perUserLimit})`
        });
      }

      // CHECK 5 — Applicable categories
      if (coupon.applicableCategories && coupon.applicableCategories.length > 0) {
        const orderCategories = orderItemsForCheck.map(i => i.medicine.category);
        const hasValidCategory = orderCategories
          .some(cat => coupon.applicableCategories.includes(cat));
        if (!hasValidCategory) {
          return res.status(400).json({ message: "Coupon not valid for items in your cart" });
        }
      }

      // CHECK 6 — Excluded products
      if (coupon.excludedProducts && coupon.excludedProducts.length > 0) {
        const hasExcluded = orderItemsForCheck
          .some(i => coupon.excludedProducts
            .some(id => id.toString() === i.medicine._id.toString()));
        if (hasExcluded) {
          return res.status(400).json({
            message: "Coupon cannot be applied to one or more items in your cart"
          });
        }
      }

      // All checks passed — apply discount
      discountAmount = coupon.calculateDiscount(totalAmount);
      totalAmount -= discountAmount;
      appliedCoupon = coupon._id;
      logger.info("Coupon applied", {
        code: coupon.code,
        discountPercent: coupon.discountPercent,
        discountAmount: discountAmount.toFixed(2)
      });
    }

    // STEP 6: BUILD ORDER ITEMS
    const orderItems = cart.items.map(item => ({
      medicine: item.medicine._id,
      quantity: item.quantity,
      price: item.medicine.price,
    }));

    // STEP 7: VALIDATE SHIPPING ADDRESS
    if (!shippingAddress || !shippingAddress.name || !shippingAddress.email || !shippingAddress.phone ||
      !shippingAddress.address || !shippingAddress.city || !shippingAddress.postalCode) {
      return res.status(400).json({
        message: "Complete shipping address is required",
        required: ["name", "email", "phone", "address", "city", "postalCode"]
      });
    }

    // STEP 8: CREATE ORDER WITHIN A TRANSACTION (FIX H10)
    // Using a MongoDB session ensures order + stock deductions are atomic.
    // If any stock deduction fails (insufficient stock under concurrent load),
    // the entire transaction is aborted and no partial state is committed.
    const session = await mongoose.startSession();
    let order;

    try {
      await session.withTransaction(async () => {
        // 8a: Atomic stock deduction — $gte guard prevents going negative
        for (const item of cart.items) {
          const updated = await Medicine.findOneAndUpdate(
            { _id: item.medicine._id, stock: { $gte: item.quantity } },
            { $inc: { stock: -item.quantity } },
            { session, new: true }
          );

          if (!updated) {
            // Stock dropped between our check and now — abort transaction
            throw new Error(
              `Insufficient stock for ${item.medicine.name}. ` +
              `The item may have sold out. Please update your cart.`
            );
          }
        }

        // 8b: Create order
        const orderData = {
          user: req.user._id,
          items: orderItems,
          totalAmount,
          subtotal: subtotal,
          deliveryCharge: deliveryCharge,
          discount: discountAmount,
          coupon: appliedCoupon,
          couponCode: couponCode || null,
          shippingAddress: {
            name: shippingAddress.name,
            email: shippingAddress.email,
            phone: shippingAddress.phone,
            address: shippingAddress.address,
            city: shippingAddress.city,
            state: shippingAddress.state || '',
            postalCode: shippingAddress.postalCode,
            country: 'India'
          },
          paymentMethod,
          paymentStatus: "pending",
          orderStatus: "processing",
        };

        [order] = await Order.create([orderData], { session });

        // 8c: Clear cart within the same transaction
        await Cart.findByIdAndUpdate(cart._id, { items: [] }, { session });
      });

      // UPGRADE 3: Increment usedCount AND record this user in usedBy for per-user limit tracking.
      // Done outside the transaction so a counter failure doesn't roll back a legitimate order.
      if (appliedCoupon) {
        await Coupon.findByIdAndUpdate(appliedCoupon, {
          $inc: { usedCount: 1 },
          $push: { usedBy: { user: req.user._id, usedAt: new Date() } }
        });
      }

      // Send confirmation email (fire-and-forget — never blocks response)
      const populatedOrder = await Order.findById(order._id).populate("items.medicine");
      sendOrderConfirmation(req.user, populatedOrder).catch(err =>
        logger.error("Order confirmation email failed:", err.message)
      );

      logger.info("Order created:", order._id);
      res.status(201).json({
        message: "Order placed successfully",
        order: populatedOrder,
        discountAmount,
      });

    } catch (txError) {
      logger.error("Order transaction failed:", txError.message);
      const isBadRequest = txError.message.includes("Insufficient stock") ||
        txError.message.includes("sold out");
      return res.status(isBadRequest ? 400 : 500).json({
        message: txError.message || "Failed to create order",
      });
    } finally {
      session.endSession();
    }

  } catch (error) {
    logger.error("Order creation failed:", error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: "Validation failed",
        errors: Object.keys(error.errors).map(key => ({
          field: key,
          message: error.errors[key].message
        }))
      });
    }
    res.status(500).json({
      message: "Failed to create order",
      // FIX-7: Don't expose internal error details in production
      error: isProd ? 'An error occurred' : error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// ==========================
// USER: GET MY ORDERS (paginated)
// ==========================
export const getMyOrders = async (req, res) => {
  try {
    // M1: Pagination — defaults keep existing callers working
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 10);
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      Order.find({ user: req.user._id })
        .populate("items.medicine")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Order.countDocuments({ user: req.user._id }),
    ]);

    res.json({
      data: orders,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit,
      },
    });
  } catch (error) {
    logger.error("Get my orders error:", error);
    res.status(500).json({ message: "Failed to fetch orders" });
  }
};

// FIX-5: Paginate getAllOrders — was fetching all orders with no limit (OOM risk at scale)
export const getAllOrders = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20);
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      Order.find()
        .populate("user", "name email")
        .populate("items.medicine")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Order.countDocuments(),
    ]);

    res.json({
      orders,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      limit,
    });
  } catch (error) {
    logger.error("Get all orders error:", error);
    res.status(500).json({ message: "Failed to fetch orders" });
  }
};

// ==========================
// ADMIN: UPDATE ORDER STATUS
// ==========================
export const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ["processing", "shipped", "delivered", "cancelled"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { orderStatus: status },
      { new: true }
    ).populate("user", "name email");

    if (!order) return res.status(404).json({ message: "Order not found" });

    // Send email notification (fire-and-forget)
    if (order.user) {
      sendOrderStatusEmail(order.user.email, order.user.name, order._id, status).catch(err =>
        logger.error("Order status email failed:", err.message)
      );
    }

    res.json(order);
  } catch (error) {
    logger.error("Update order status error:", error);
    res.status(500).json({ message: "Failed to update order status" });
  }
};

// ==========================
// USER: CANCEL ORDER
// ==========================
export const cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate("items.medicine");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Ensure the order belongs to the requesting user
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to cancel this order" });
    }

    // Only allow cancellation if order is still processing
    if (order.orderStatus !== "processing") {
      return res.status(400).json({
        message: `Cannot cancel an order that is already "${order.orderStatus}". Only processing orders can be cancelled.`,
      });
    }

    // Restore stock for each item
    for (const item of order.items) {
      if (item.medicine) {
        await Medicine.findByIdAndUpdate(item.medicine._id, {
          $inc: { stock: item.quantity },
        });
        logger.info(`Restored ${item.quantity} units of ${item.medicine.name}`);
      }
    }

    // FIX-9: Restore coupon usage if a coupon was applied
    if (order.couponCode) {
      try {
        await Coupon.findOneAndUpdate(
          { code: order.couponCode.toUpperCase() },
          {
            $inc: { usedCount: -1 },
            $pull: { usedBy: { user: order.user } }
          }
        );
        // Ensure usedCount never goes below 0 (guard against double-cancel edge case)
        await Coupon.updateOne(
          { code: order.couponCode.toUpperCase(), usedCount: { $lt: 0 } },
          { $set: { usedCount: 0 } }
        );
        logger.info(`Restored coupon usage for ${order.couponCode} (order ${order._id})`);
      } catch (couponErr) {
        // Non-fatal — log but don't block cancellation
        logger.error("Failed to restore coupon usage on cancel:", couponErr.message);
      }
    }

    // Update order status
    order.orderStatus = "cancelled";
    await order.save();

    // Send email notification
    sendOrderStatusEmail(req.user.email, req.user.name, order._id, "cancelled").catch(err =>
      logger.error("Cancellation email failed:", err.message)
    );

    logger.info(`Order ${order._id} cancelled by user ${req.user._id}`);
    res.json({ message: "Order cancelled successfully", order });
  } catch (error) {
    logger.error("Cancel order error:", error);
    res.status(500).json({ message: "Failed to cancel order" });
  }
};

// ==========================
// GET SINGLE ORDER DETAILS
// ==========================
export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("user", "name email")
      .populate("items.medicine");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Check if user is authorized (admin or order owner)
    // FIX C4: Use role === 'admin' — isAdmin field does not exist on User schema.
    if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: "Not authorized to view this order" });
    }

    res.json(order);
  } catch (error) {
    logger.error("Get order by ID error:", error);
    res.status(500).json({ message: "Failed to fetch order" });
  }
};