import mongoose from "mongoose";
import Order from "../models/Order.js";
import Cart from "../models/Cart.js";
import Medicine from "../models/Medicine.js";
import Coupon from "../models/Coupon.js";
import { sendOrderConfirmation, sendOrderStatusEmail } from "../services/emailService.js";

// ==========================
// CREATE ORDER (COD or Razorpay Pending)
// ==========================
export const createOrder = async (req, res) => {
  try {
    const { shippingAddress, paymentMethod, couponCode } = req.body;

    console.log("📦 Creating order for user:", req.user._id);
    console.log("🏷️ Coupon code received:", couponCode || "None");
    console.log("📦 Shipping address received:", shippingAddress);

    // STEP 1: FETCH USER'S CART
    let cart = await Cart.findOne({ user: req.user._id }).populate("items.medicine");
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    // STEP 2: VALIDATE STOCK
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

    // STEP 3: CALCULATE TOTAL
    const subtotal = cart.items.reduce((sum, item) => sum + item.medicine.price * item.quantity, 0);
    const deliveryCharge = 0; // Free delivery
    let totalAmount = subtotal;
    let appliedCoupon = null;
    let discountAmount = 0;

    // STEP 4: APPLY COUPON
    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true });
      if (coupon && totalAmount >= coupon.minOrderAmount) {
        discountAmount = (totalAmount * coupon.discountPercent) / 100;
        totalAmount -= discountAmount;
        appliedCoupon = coupon._id;
        console.log(`✅ Coupon applied: ${coupon.code} — ${coupon.discountPercent}% off (₹${discountAmount.toFixed(2)} saved)`);
      }
    }

    // STEP 5: BUILD ORDER ITEMS
    const orderItems = cart.items.map(item => ({
      medicine: item.medicine._id,
      quantity: item.quantity,
      price: item.medicine.price,
    }));

    // STEP 6: VALIDATE SHIPPING ADDRESS
    if (!shippingAddress || !shippingAddress.name || !shippingAddress.email || !shippingAddress.phone || 
        !shippingAddress.address || !shippingAddress.city || !shippingAddress.postalCode) {
      return res.status(400).json({ 
        message: "Complete shipping address is required",
        required: ["name", "email", "phone", "address", "city", "postalCode"]
      });
    }

    // STEP 7: TRY TRANSACTION (Replica Set) OR FALLBACK (Standalone)
    let session = null;
    let useTransaction = false;

    try {
      session = await mongoose.startSession();
      session.startTransaction();
      useTransaction = true;
    } catch (err) {
      console.warn("⚠️ Transactions not supported (standalone MongoDB). Running without transaction.");
      session = null;
      useTransaction = false;
    }

    try {
      // Create order with ALL required fields
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
        paymentStatus: paymentMethod === "cod" ? "pending" : "pending",
        orderStatus: "processing",
      };

      console.log("📦 Order data being saved:", JSON.stringify(orderData, null, 2));

      let order;
      if (useTransaction && session) {
        [order] = await Order.create([orderData], { session });
      } else {
        order = await Order.create(orderData);
      }

      // Deduct stock
      for (const item of cart.items) {
        if (useTransaction && session) {
          await Medicine.findByIdAndUpdate(
            item.medicine._id,
            { $inc: { stock: -item.quantity } },
            { session }
          );
        } else {
          await Medicine.findByIdAndUpdate(item.medicine._id, { $inc: { stock: -item.quantity } });
        }
      }

      // Clear cart
      if (useTransaction && session) {
        await Cart.findByIdAndUpdate(cart._id, { items: [] }, { session });
      } else {
        await Cart.findByIdAndUpdate(cart._id, { items: [] });
      }

      if (useTransaction && session) {
        await session.commitTransaction();
        console.log("✅ Transaction committed");
      }

      // Send confirmation email (fire-and-forget)
      const populatedOrder = await Order.findById(order._id).populate("items.medicine");
      sendOrderConfirmation(req.user, populatedOrder).catch(err =>
        console.error("Order confirmation email failed:", err.message)
      );

      console.log("✅ Order created:", order._id);
      res.status(201).json({
        message: "Order placed successfully",
        order: populatedOrder,
        discountAmount,
      });

    } catch (transactionError) {
      if (useTransaction && session) {
        await session.abortTransaction();
        console.error("❌ Transaction aborted:", transactionError);
      }
      throw transactionError;
    } finally {
      if (session) session.endSession();
    }

  } catch (error) {
    console.error("❌ Order creation failed:", error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: "Validation failed", 
        errors: Object.keys(error.errors).map(key => ({
          field: key,
          message: error.errors[key].message
        }))
      });
    }
    res.status(500).json({ message: "Failed to create order", error: error.message });
  }
};

// ==========================
// USER: GET MY ORDERS
// ==========================
export const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .populate("items.medicine")
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    console.error("Get my orders error:", error);
    res.status(500).json({ message: "Failed to fetch orders" });
  }
};

// ==========================
// ADMIN: GET ALL ORDERS
// ==========================
export const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("user", "name email")
      .populate("items.medicine")
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    console.error("Get all orders error:", error);
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
        console.error("Order status email failed:", err.message)
      );
    }

    res.json(order);
  } catch (error) {
    console.error("Update order status error:", error);
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
        console.log(`♻️ Restored ${item.quantity} units of ${item.medicine.name}`);
      }
    }

    // Update order status
    order.orderStatus = "cancelled";
    await order.save();

    // Send email notification
    sendOrderStatusEmail(req.user.email, req.user.name, order._id, "cancelled").catch(err =>
      console.error("Cancellation email failed:", err.message)
    );

    console.log(`✅ Order ${order._id} cancelled by user ${req.user._id}`);
    res.json({ message: "Order cancelled successfully", order });
  } catch (error) {
    console.error("Cancel order error:", error);
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
    if (order.user._id.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      return res.status(403).json({ message: "Not authorized to view this order" });
    }

    res.json(order);
  } catch (error) {
    console.error("Get order by ID error:", error);
    res.status(500).json({ message: "Failed to fetch order" });
  }
};