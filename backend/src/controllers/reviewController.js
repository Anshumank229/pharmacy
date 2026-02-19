import mongoose from 'mongoose';
import Review from '../models/Review.js';
import Medicine from '../models/Medicine.js';
import Order from '../models/Order.js';

// @desc    Add a new review
// @route   POST /api/medicines/:id/reviews
// @access  Private
export const addReview = async (req, res) => {
    try {
        const { rating, comment } = req.body;
        const medicineId = req.params.id;
        const userId = req.user._id;

        // 1. Check if user bought and received this medicine
        const hasOrdered = await Order.findOne({
            user: userId,
            orderStatus: 'delivered',
            'items.medicine': medicineId
        });

        if (!hasOrdered) {
            return res.status(403).json({
                message: 'You can only review medicines you have purchased and received.'
            });
        }

        // 2. Check if already reviewed
        const alreadyReviewed = await Review.findOne({
            user: userId,
            medicine: medicineId
        });

        if (alreadyReviewed) {
            return res.status(400).json({ message: 'You have already reviewed this medicine.' });
        }

        // 3. Create review
        const review = await Review.create({
            user: userId,
            medicine: medicineId,
            rating: Number(rating),
            comment
        });

        // 4. Calculate new average rating
        const stats = await Review.aggregate([
            { $match: { medicine: new mongoose.Types.ObjectId(medicineId) } },
            {
                $group: {
                    _id: '$medicine',
                    averageRating: { $avg: '$rating' },
                    totalReviews: { $sum: 1 }
                }
            }
        ]);

        if (stats.length > 0) {
            await Medicine.findByIdAndUpdate(medicineId, {
                averageRating: stats[0].averageRating.toFixed(1),
                totalReviews: stats[0].totalReviews
            });
        } else {
            await Medicine.findByIdAndUpdate(medicineId, {
                averageRating: 0,
                totalReviews: 0
            });
        }

        res.status(201).json(review);
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'You have already reviewed this medicine.' });
        }
        res.status(500).json({ message: 'Failed to add review', error: error.message });
    }
};

// @desc    Get reviews for a medicine
// @route   GET /api/medicines/:id/reviews
// @access  Public
export const getReviews = async (req, res) => {
    try {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 5;
        const skip = (page - 1) * limit;

        const reviews = await Review.find({ medicine: req.params.id })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('user', 'name');

        // Get fresh total from DB or use the aggregated count on Medicine model
        // Using simple count here for pagination accuracy
        const total = await Review.countDocuments({ medicine: req.params.id });

        // Also return the aggregate stats from Medicine model for the summary header
        const medicine = await Medicine.findById(req.params.id).select('averageRating totalReviews');

        res.json({
            reviews,
            page,
            pages: Math.ceil(total / limit),
            totalReviews: total, // Actual count of reviews
            averageRating: medicine ? medicine.averageRating : 0,
            cachedTotalReviews: medicine ? medicine.totalReviews : 0
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch reviews', error: error.message });
    }
};
