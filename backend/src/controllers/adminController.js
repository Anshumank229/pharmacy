import User from "../models/User.js";
import Order from "../models/Order.js";
import Medicine from "../models/Medicine.js";
import bcrypt from "bcryptjs";

// Get low stock medicines (stock <= 10)
export const getLowStockMedicines = async (req, res) => {
  try {
    const lowStockMedicines = await Medicine.find({ stock: { $lte: 10 } })
      .sort({ stock: 1 })
      .limit(50); // Limit to top 50 critical items

    res.json({
      medicines: lowStockMedicines,
      count: lowStockMedicines.length
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch low stock medicines", error: error.message });
  }
};

export const getAdminStats = async (req, res) => {
  try {
    const users = await User.countDocuments();
    const orders = await Order.countDocuments();
    const medicines = await Medicine.countDocuments();

    const revenue = await Order.aggregate([
      { $match: { paymentStatus: "paid" } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } }
    ]);

    // Get today's stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [todayOrders, pendingOrders] = await Promise.all([
      Order.countDocuments({ createdAt: { $gte: today, $lt: tomorrow } }),
      Order.countDocuments({ orderStatus: "pending" })
    ]);

    res.json({
      users,
      orders,
      medicines,
      revenue: revenue[0] ? revenue[0].total : 0,
      todayOrders,
      pendingOrders
    });
  } catch (error) {
    console.error("Stats error:", error);
    res.status(500).json({ message: "Failed to load stats" });
  }
};

// Get all users for admin — with pagination
export const getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const [total, users] = await Promise.all([
      User.countDocuments(),
      User.find()
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
    ]);

    res.json({
      users,
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch users", error: error.message });
  }
};

// Get all orders for admin — with pagination
export const getAllOrdersAdmin = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const [total, orders] = await Promise.all([
      Order.countDocuments(),
      Order.find()
        .populate("user", "name email")
        .populate("items.medicine")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
    ]);

    res.json({
      orders,
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch orders", error: error.message });
  }
};

// =====================================================
// NEW ADMIN USER MANAGEMENT FUNCTIONS
// =====================================================

// @desc    Create a new user (admin only)
// @route   POST /api/admin/users
// @access  Private/Admin
export const createUserByAdmin = async (req, res) => {
  try {
    const { name, email, password, phone, address, role } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists with this email" });
    }

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password are required" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      phone,
      address,
      role: role || "user",
      isAdmin: role === "admin" // Set isAdmin flag based on role
    });

    // Return user without password
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json({
      success: true,
      message: "User created successfully",
      user: userResponse
    });
  } catch (error) {
    console.error("Create user error:", error);
    res.status(500).json({ message: "Failed to create user", error: error.message });
  }
};

// @desc    Update a user (admin only)
// @route   PUT /api/admin/users/:id
// @access  Private/Admin
export const updateUserByAdmin = async (req, res) => {
  try {
    const { name, email, phone, address, role, isActive } = req.body;
    const userId = req.params.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if email is being changed and already exists
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: "Email already in use" });
      }
    }

    // Update fields
    if (name) user.name = name;
    if (email) user.email = email;
    if (phone !== undefined) user.phone = phone;
    if (address !== undefined) user.address = address;
    if (role) {
      user.role = role;
      user.isAdmin = role === "admin";
    }
    if (isActive !== undefined) user.isActive = isActive;

    await user.save();

    // Return updated user without password
    const userResponse = user.toObject();
    delete userResponse.password;

    res.json({
      success: true,
      message: "User updated successfully",
      user: userResponse
    });
  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({ message: "Failed to update user", error: error.message });
  }
};

// @desc    Delete a user (admin only)
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
export const deleteUserByAdmin = async (req, res) => {
  try {
    const userId = req.params.id;

    // Prevent admin from deleting themselves
    if (userId === req.user._id.toString()) {
      return res.status(400).json({ message: "Cannot delete your own account" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if user has orders
    const hasOrders = await Order.exists({ user: userId });
    if (hasOrders) {
      return res.status(400).json({ 
        message: "Cannot delete user with existing orders. Consider deactivating instead." 
      });
    }

    await user.deleteOne();

    res.json({
      success: true,
      message: "User deleted successfully"
    });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({ message: "Failed to delete user", error: error.message });
  }
};

// @desc    Get single user details (admin only)
// @route   GET /api/admin/users/:id
// @access  Private/Admin
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Get user's order count and total spent
    const [orderCount, totalSpent] = await Promise.all([
      Order.countDocuments({ user: user._id }),
      Order.aggregate([
        { $match: { user: user._id, paymentStatus: "paid" } },
        { $group: { _id: null, total: { $sum: "$totalAmount" } } }
      ])
    ]);

    res.json({
      ...user.toObject(),
      stats: {
        orderCount,
        totalSpent: totalSpent[0]?.total || 0
      }
    });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ message: "Failed to fetch user", error: error.message });
  }
};

// @desc    Toggle user active status (admin only)
// @route   PATCH /api/admin/users/:id/toggle-status
// @access  Private/Admin
export const toggleUserStatus = async (req, res) => {
  try {
    const userId = req.params.id;

    // Prevent admin from deactivating themselves
    if (userId === req.user._id.toString()) {
      return res.status(400).json({ message: "Cannot change your own status" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.json({
      success: true,
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
      isActive: user.isActive
    });
  } catch (error) {
    console.error("Toggle user status error:", error);
    res.status(500).json({ message: "Failed to update user status", error: error.message });
  }
};