import { Router } from 'express';
import {
  bookSession,
  getUserSessions,
  getSupporterBookings,
  getSessionDetails,
  cancelSession,
  acceptSession,
  addSessionFeedback,
  updateSessionDetails,
  getAvailableSlots,
} from '../controllers/session.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';

const router = Router();

// All routes require authentication
router.use(verifyToken);

// Get available slots for a peer supporter on a specific date
router.get('/available-slots', getAvailableSlots);

// Book a new session
router.post('/book', bookSession);

// Get user's booked sessions
router.get('/my', getUserSessions);

// Get peer supporter's bookings
router.get('/peer-supporter/bookings', getSupporterBookings);

// Get specific session details
router.get('/:sessionId', getSessionDetails);

// Cancel a session
router.post('/:sessionId/cancel', cancelSession);

// Accept a session (peer counselor only)
router.post('/:sessionId/accept', acceptSession);

// Add feedback to session
router.post('/:sessionId/feedback', addSessionFeedback);

// Update session details
router.put('/:sessionId/details', updateSessionDetails);

export default router;
