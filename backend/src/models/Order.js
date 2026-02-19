// src/models/Order.js
import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
  {
    medicine: { type: mongoose.Schema.Types.ObjectId, ref: "Medicine", required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true }
  },
  { _id: false }
);

// FIX: Create a proper shipping address schema
const shippingAddressSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String },
    postalCode: { type: String, required: true },
    country: { type: String, default: 'India' }
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    items: [orderItemSchema],
    totalAmount: { type: Number, required: true },
    subtotal: { type: Number }, // Added for clarity
    deliveryCharge: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    coupon: { type: mongoose.Schema.Types.ObjectId, ref: "Coupon" },
    couponCode: { type: String }, // Store the actual code used
    paymentMethod: {
      type: String,
      enum: ["cod", "razorpay", "card", "upi"],
      default: "cod"
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending"
    },
    orderStatus: {
      type: String,
      enum: ["pending", "processing", "shipped", "delivered", "cancelled"],
      default: "pending"
    },
    // FIX: Change from String to Object using shippingAddressSchema
    shippingAddress: { type: shippingAddressSchema, required: true },
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },
    razorpaySignature: { type: String },
    paymentVerifiedAt: { type: Date }
  },
  { timestamps: true }
);

// ─── Indexes for query performance ────────────────────────────────────────────
orderSchema.index({ user: 1 });              // Fetch orders by user
orderSchema.index({ orderStatus: 1 });       // Filter by status
orderSchema.index({ paymentStatus: 1 });     // Filter by payment status
orderSchema.index({ createdAt: -1 });        // Sort newest first
orderSchema.index({ coupon: 1 });            // Coupon usage analytics
orderSchema.index({ razorpayOrderId: 1 });   // Payment lookups

// Helper method to check if order can be cancelled
orderSchema.methods.canBeCancelled = function() {
  return ['pending', 'processing'].includes(this.orderStatus) && 
         this.paymentStatus !== 'paid';
};

const Order = mongoose.model("Order", orderSchema);

// ─── Migration Helper Function ───────────────────────────────────────────────
// Run this once to migrate existing string addresses to object format
export const migrateStringAddresses = async () => {
  try {
    const orders = await Order.find({ 
      $expr: { $eq: [{ $type: "$shippingAddress" }, "string"] }
    });
    
    console.log(`Found ${orders.length} orders with string addresses to migrate`);
    
    for (const order of orders) {
      // If it's a string, try to parse or convert to object
      if (typeof order.shippingAddress === 'string') {
        // Try to get user info for better migration
        const user = await mongoose.model('User').findById(order.user);
        
        order.shippingAddress = {
          name: user?.name || 'Unknown',
          email: user?.email || 'unknown@email.com',
          phone: user?.phone || '0000000000',
          address: order.shippingAddress, // Use the string as the address line
          city: 'Unknown',
          state: '',
          postalCode: '000000',
          country: 'India'
        };
        
        await order.save();
        console.log(`Migrated order ${order._id}`);
      }
    }
    
    console.log('Migration complete');
  } catch (error) {
    console.error('Migration failed:', error);
  }
};

export default Order;