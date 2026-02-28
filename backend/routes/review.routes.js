import { Router } from 'express';
import { verifyToken } from '../middlewares/auth.middleware.js';
import { createReview, getEventReviews, getCounselorReviews, deleteReview } from '../controllers/review.controller.js';

const router = Router();

// Public
router.get('/event/:eventId', getEventReviews);
router.get('/counselor/:counselorId', getCounselorReviews);

// Protected
router.post('/', verifyToken, createReview);
router.delete('/:id', verifyToken, deleteReview);

export default router;
