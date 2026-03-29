import { Router } from 'express';
import { verifyToken } from '../middlewares/auth.middleware.js';
import { createBooking, getMyBookings, getCounselorBookings, getBookingById, cancelBooking, uploadBankSlip } from '../controllers/booking.controller.js';
import upload, { handleMulterError } from '../middlewares/upload.middleware.js';

const router = Router();

router.use(verifyToken); // All booking routes require auth

router.post('/', createBooking);
router.get('/my', getMyBookings);
router.get('/counselor', getCounselorBookings);
router.get('/:id', getBookingById);
router.post('/:id/cancel', cancelBooking);
router.post('/:id/upload-slip', upload.single('slip'), handleMulterError, uploadBankSlip);

export default router;
