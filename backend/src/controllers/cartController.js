import Cart from "../models/Cart.js";

// Get user cart
export const getCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id })
      .populate("items.medicine");
    res.json(cart || { items: [] });
  } catch (error) {
    res.status(500).json({ message: "Failed to get cart" });
  }
};

// Add to cart
export const addToCart = async (req, res) => {
  try {
    const { medicineId, quantity } = req.body;

    let cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      // BUG 6 FIX: After creating a new cart, re-fetch with .populate()
      // so the client receives full medicine objects instead of raw ObjectIds.
      await Cart.create({
        user: req.user._id,
        items: [{ medicine: medicineId, quantity }]
      });
      cart = await Cart.findOne({ user: req.user._id }).populate("items.medicine");
      return res.json(cart);
    }

    // If medicine already exists, update quantity
    const itemIndex = cart.items.findIndex(
      i => i.medicine.toString() === medicineId
    );

    if (itemIndex > -1) {
      cart.items[itemIndex].quantity += quantity;
    } else {
      cart.items.push({ medicine: medicineId, quantity });
    }

    await cart.save();
    await cart.populate("items.medicine");
    res.json(cart);
  } catch (error) {
    res.status(500).json({ message: "Failed to add to cart" });
  }
};

// Update cart item quantity
export const updateCart = async (req, res) => {
  try {
    const { medicineId, quantity } = req.body;

    const cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    const itemIndex = cart.items.findIndex(
      i => i.medicine.toString() === medicineId
    );

    if (itemIndex === -1) {
      return res.status(404).json({ message: "Item not found in cart" });
    }

    if (quantity <= 0) {
      // Remove item if quantity is 0 or less
      cart.items.splice(itemIndex, 1);
    } else {
      // Update quantity
      cart.items[itemIndex].quantity = quantity;
    }

    await cart.save();
    await cart.populate("items.medicine");

    res.json({ message: "Cart updated", cart });
  } catch (error) {
    console.error('Update cart error:', error);
    res.status(500).json({ message: "Failed to update cart" });
  }
};

// Remove item from cart
export const removeFromCart = async (req, res) => {
  try {
    const { medicineId } = req.body;

    const cart = await Cart.findOneAndUpdate(
      { user: req.user._id },
      {
        $pull: { items: { medicine: medicineId } }
      },
      { new: true }
    ).populate("items.medicine");

    res.json(cart);
  } catch (error) {
    res.status(500).json({ message: "Failed to remove from cart" });
  }
};

// Clear cart
export const clearCart = async (req, res) => {
  try {
    await Cart.findOneAndDelete({ user: req.user._id });
    res.json({ message: "Cart cleared" });
  } catch (error) {
    res.status(500).json({ message: "Failed to clear cart" });
  }
};
