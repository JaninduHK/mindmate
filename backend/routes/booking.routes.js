import { Router } from 'express';
import { verifyToken } from '../middlewares/auth.middleware.js';
import { createBooking, getMyBookings, getBookingById, cancelBooking } from '../controllers/booking.controller.js';

const router = Router();

router.use(verifyToken); // All booking routes require auth

router.post('/', createBooking);
router.get('/my', getMyBookings);
router.get('/:id', getBookingById);
router.post('/:id/cancel', cancelBooking);

export default router;
