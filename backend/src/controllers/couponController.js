import Coupon from "../models/Coupon.js";

// =====================================================
// ADMIN: Create Coupon
// =====================================================
export const createCoupon = async (req, res) => {
  try {
    // Standardize field names - map incoming fields to schema
    const couponData = {
      code: req.body.code?.trim().toUpperCase(),
      discountPercent: req.body.discountPercent || req.body.discount,
      // Use minOrderAmount consistently (standardized field name)
      minOrderAmount: req.body.minOrderAmount || req.body.minAmount || 0,
      maxDiscount: req.body.maxDiscount,
      validFrom: req.body.validFrom || req.body.startDate,
      validUntil: req.body.validUntil || req.body.expiryDate || req.body.endDate,
      usageLimit: req.body.usageLimit || req.body.maxUses,
      usedCount: 0,
      isActive: req.body.isActive !== undefined ? req.body.isActive : true,
      description: req.body.description
    };

    // Validate required fields
    if (!couponData.code) {
      return res.status(400).json({ message: "Coupon code is required" });
    }
    
    if (!couponData.discountPercent || couponData.discountPercent <= 0 || couponData.discountPercent > 100) {
      return res.status(400).json({ message: "Valid discount percent (1-100) is required" });
    }

    console.log("📝 Creating new coupon:", couponData.code);
    
    // Check if coupon code already exists
    const existingCoupon = await Coupon.findOne({ code: couponData.code });
    if (existingCoupon) {
      return res.status(400).json({ message: "Coupon code already exists" });
    }
    
    const coupon = await Coupon.create(couponData);
    console.log("✅ Coupon created successfully:", coupon.code);
    res.status(201).json(coupon);
  } catch (error) {
    console.error("❌ Failed to create coupon:", error.message);
    res.status(500).json({ message: "Failed to create coupon", error: error.message });
  }
};

// =====================================================
// ADMIN: Get All Coupons
// =====================================================
export const getCoupons = async (req, res) => {
  try {
    console.log("📋 Fetching all coupons");
    const { isActive, page = 1, limit = 50 } = req.query;
    
    const query = {};
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }
    
    const coupons = await Coupon.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Coupon.countDocuments(query);
    
    console.log(`✅ Found ${coupons.length} coupons`);
    res.json({
      coupons,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit),
      total
    });
  } catch (error) {
    console.error("❌ Failed to fetch coupons:", error.message);
    res.status(500).json({ message: "Failed to fetch coupons" });
  }
};

// =====================================================
// ADMIN: Get Single Coupon
// =====================================================
export const getCouponById = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    
    if (!coupon) {
      return res.status(404).json({ message: "Coupon not found" });
    }
    
    res.json(coupon);
  } catch (error) {
    console.error("❌ Failed to fetch coupon:", error.message);
    res.status(500).json({ message: "Failed to fetch coupon" });
  }
};

// =====================================================
// ADMIN: Update Coupon
// =====================================================
export const updateCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    
    if (!coupon) {
      return res.status(404).json({ message: "Coupon not found" });
    }
    
    // Update fields (with standardization)
    if (req.body.code) coupon.code = req.body.code.trim().toUpperCase();
    if (req.body.discountPercent || req.body.discount) {
      coupon.discountPercent = req.body.discountPercent || req.body.discount;
    }
    if (req.body.minOrderAmount || req.body.minAmount) {
      coupon.minOrderAmount = req.body.minOrderAmount || req.body.minAmount;
    }
    if (req.body.maxDiscount !== undefined) coupon.maxDiscount = req.body.maxDiscount;
    if (req.body.validFrom || req.body.startDate) {
      coupon.validFrom = req.body.validFrom || req.body.startDate;
    }
    if (req.body.validUntil || req.body.expiryDate) {
      coupon.validUntil = req.body.validUntil || req.body.expiryDate;
    }
    if (req.body.usageLimit !== undefined) coupon.usageLimit = req.body.usageLimit;
    if (req.body.isActive !== undefined) coupon.isActive = req.body.isActive;
    if (req.body.description !== undefined) coupon.description = req.body.description;
    
    await coupon.save();
    
    res.json(coupon);
  } catch (error) {
    console.error("❌ Failed to update coupon:", error.message);
    res.status(500).json({ message: "Failed to update coupon" });
  }
};

// =====================================================
// ADMIN: Delete Coupon
// =====================================================
export const deleteCoupon = async (req, res) => {
  try {
    console.log("🗑️ Deleting coupon:", req.params.id);
    const coupon = await Coupon.findByIdAndDelete(req.params.id);
    
    if (!coupon) {
      return res.status(404).json({ message: "Coupon not found" });
    }
    
    console.log("✅ Coupon deleted successfully");
    res.json({ message: "Coupon deleted", code: coupon.code });
  } catch (error) {
    console.error("❌ Failed to delete coupon:", error.message);
    res.status(500).json({ message: "Failed to delete coupon" });
  }
};

// =====================================================
// USER: Validate Coupon Code (Checkout)
// =====================================================
export const validateCoupon = async (req, res) => {
  try {
    const { code, cartTotal } = req.body;

    console.log(`🎫 Validating coupon: "${code}" for cart total: ₹${cartTotal}`);

    if (!code || cartTotal === undefined) {
      return res.status(400).json({
        valid: false,
        message: "Coupon code and cart total are required",
      });
    }

    // Normalize to uppercase for case-insensitive matching
    const normalizedCode = code.trim().toUpperCase();
    const coupon = await Coupon.findOne({ code: normalizedCode });

    if (!coupon) {
      console.log("❌ Invalid coupon code");
      return res.status(404).json({
        valid: false,
        message: "Invalid coupon code",
      });
    }

    // Check if active
    if (!coupon.isActive) {
      console.log("❌ Coupon is not active");
      return res.status(400).json({
        valid: false,
        message: "Coupon is not active",
      });
    }

    // Check validity period
    const now = new Date();
    if (coupon.validFrom && coupon.validFrom > now) {
      console.log("❌ Coupon not yet valid");
      return res.status(400).json({
        valid: false,
        message: `Coupon is valid from ${coupon.validFrom.toLocaleDateString()}`,
      });
    }

    if (coupon.validUntil && coupon.validUntil < now) {
      console.log("❌ Coupon has expired");
      return res.status(400).json({
        valid: false,
        message: "Coupon has expired",
      });
    }

    // Check minimum order amount (using standardized minOrderAmount)
    if (cartTotal < coupon.minOrderAmount) {
      console.log(`❌ Cart total below minimum: ₹${cartTotal} < ₹${coupon.minOrderAmount}`);
      return res.status(400).json({
        valid: false,
        message: `Minimum order amount of ₹${coupon.minOrderAmount} required`,
      });
    }

    // Check usage limit
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      console.log("❌ Coupon usage limit exceeded");
      return res.status(400).json({
        valid: false,
        message: "Coupon usage limit has been reached",
      });
    }

    // Calculate discount
    let discountAmount = Math.round((cartTotal * coupon.discountPercent) / 100);
    
    // Apply max discount cap if set
    if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
      discountAmount = coupon.maxDiscount;
    }

    const finalAmount = cartTotal - discountAmount;

    console.log(`✅ Coupon valid! Discount: ₹${discountAmount} (${coupon.discountPercent}%)`);
    console.log(`💰 Final amount: ₹${finalAmount}`);

    res.status(200).json({
      valid: true,
      discount: discountAmount,
      discountPercent: coupon.discountPercent,
      finalAmount,
      couponId: coupon._id,
      couponCode: coupon.code,
      message: `Coupon applied! You saved ₹${discountAmount}`,
    });
  } catch (error) {
    console.error("❌ Coupon validation error:", error.message);
    res.status(500).json({
      valid: false,
      message: "Failed to validate coupon",
      error: error.message,
    });
  }
};

// =====================================================
// USER: Apply Coupon to Order (increment usage count)
// =====================================================
export const applyCouponToOrder = async (req, res) => {
  try {
    const { couponId } = req.body;
    
    const coupon = await Coupon.findById(couponId);
    
    if (!coupon) {
      return res.status(404).json({ message: "Coupon not found" });
    }
    
    // Increment usage count
    coupon.usedCount = (coupon.usedCount || 0) + 1;
    await coupon.save();
    
    res.json({
      success: true,
      message: "Coupon applied successfully"
    });
  } catch (error) {
    console.error("❌ Failed to apply coupon:", error.message);
    res.status(500).json({ message: "Failed to apply coupon" });
  }
};

// =====================================================
// ADMIN: Get Coupon Statistics
// =====================================================
export const getCouponStats = async (req, res) => {
  try {
    const stats = await Coupon.aggregate([
      {
        $group: {
          _id: null,
          totalCoupons: { $sum: 1 },
          activeCoupons: { $sum: { $cond: ["$isActive", 1, 0] } },
          totalUses: { $sum: "$usedCount" },
          avgDiscount: { $avg: "$discountPercent" }
        }
      }
    ]);
    
    const recentlyExpired = await Coupon.find({
      validUntil: { $lt: new Date(), $gt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    }).countDocuments();
    
    res.json({
      stats: stats[0] || { totalCoupons: 0, activeCoupons: 0, totalUses: 0, avgDiscount: 0 },
      recentlyExpired
    });
  } catch (error) {
    console.error("❌ Failed to get coupon stats:", error.message);
    res.status(500).json({ message: "Failed to get coupon statistics" });
  }
};