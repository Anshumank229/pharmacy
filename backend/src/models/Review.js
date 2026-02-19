import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    medicine: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Medicine',
        required: true
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    comment: {
        type: String,
        maxlength: 500,
        trim: true
    },
}, {
    timestamps: true
});

// Ensure one review per user per medicine
reviewSchema.index({ user: 1, medicine: 1 }, { unique: true });
// Optimize queries for medicine reviews
reviewSchema.index({ medicine: 1 });

const Review = mongoose.model('Review', reviewSchema);

export default Review;
