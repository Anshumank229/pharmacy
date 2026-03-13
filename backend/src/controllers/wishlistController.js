import Wishlist from "../models/Wishlist.js";
import Medicine from "../models/Medicine.js";

// @desc    Get user wishlist (paginated)
// @route   GET /api/wishlist?page=1&limit=10
// @access  Private
export const getWishlist = async (req, res) => {
    try {
        // M1: Pagination with safe defaults
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(50, parseInt(req.query.limit) || 10);
        const skip = (page - 1) * limit;

        const wishlist = await Wishlist.findOne({ user: req.user._id }).populate({
            path: "medicines",
            select: "name price stock imageUrl averageRating totalReviews category brand",
        });

        if (!wishlist) {
            return res.status(200).json({
                medicines: [],
                pagination: { total: 0, page, pages: 0, limit },
            });
        }

        const total = wishlist.medicines.length;
        const paginated = wishlist.medicines.slice(skip, skip + limit);

        res.json({
            medicines: paginated,       // kept for backward compat
            pagination: {
                total,
                page,
                pages: Math.ceil(total / limit),
                limit,
            },
        });
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch wishlist", error: error.message });
    }
};


// @desc    Toggle item in wishlist (Add/Remove)
// @route   POST /api/wishlist/:medicineId
// @access  Private
export const toggleWishlist = async (req, res) => {
    try {
        const { medicineId } = req.params;
        const userId = req.user._id;

        // Check if medicine exists
        const medicine = await Medicine.findById(medicineId);
        if (!medicine) {
            return res.status(404).json({ message: "Medicine not found" });
        }

        // Find wishlist or create if doesn't exist
        let wishlist = await Wishlist.findOne({ user: userId });

        if (!wishlist) {
            wishlist = await Wishlist.create({ user: userId, medicines: [medicineId] });
            return res.status(201).json({ added: true, message: "Added to wishlist" });
        }

        // Check if medicine is already in wishlist
        const isPresent = wishlist.medicines.some((id) => id.toString() === medicineId);

        if (isPresent) {
            // Remove
            wishlist.medicines = wishlist.medicines.filter(
                (id) => id.toString() !== medicineId
            );
            await wishlist.save();
            return res.status(200).json({ added: false, message: "Removed from wishlist" });
        } else {
            // Add
            wishlist.medicines.push(medicineId);
            await wishlist.save();
            return res.status(200).json({ added: true, message: "Added to wishlist" });
        }
    } catch (error) {
        res.status(500).json({ message: "Failed to update wishlist", error: error.message });
    }
};
