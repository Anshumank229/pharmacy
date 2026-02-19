// src/models/Cart.js
import mongoose from "mongoose";

const cartSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    items: [
      {
        medicine: { type: mongoose.Schema.Types.ObjectId, ref: "Medicine" },
        quantity: { type: Number, default: 1 }
      }
    ]
  },
  { timestamps: true }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
// Unique index ensures one cart per user and makes lookups O(1)
cartSchema.index({ user: 1 }, { unique: true });

const Cart = mongoose.model("Cart", cartSchema);
export default Cart;
