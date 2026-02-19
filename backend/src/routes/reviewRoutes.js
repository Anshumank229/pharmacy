import express from 'express';
import { addReview, getReviews } from '../controllers/reviewController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validate.js';
import { body } from 'express-validator';

const router = express.Router({ mergeParams: true });

const reviewValidation = [
    body('rating')
        .isInt({ min: 1, max: 5 })
        .withMessage('Rating must be between 1 and 5'),
    body('comment')
        .optional()
        .isString()
        .isLength({ max: 500 })
        .withMessage('Comment cannot exceed 500 characters')
];

router
    .route('/')
    .post(protect, reviewValidation, validate, addReview)
    .get(getReviews);

export default router;
