import express from 'express';
import { verifyToken } from '../middlewares/auth.middleware.js';
import {
  addAvailability,
  getMyAvailability,
  getAvailabilityByCounselor,
  updateAvailability,
  deleteAvailability,
  getAvailableCounselors,
  checkAvailability,
  getAvailabilityStats,
} from '../controllers/availability.controller.js';
import { USER_ROLES } from '../config/constants.js';

const router = express.Router();

/**
 * Middleware to check if user is a peer supporter
 */
const isPeerSupporter = (req, res, next) => {
  if (req.user && req.user.role === USER_ROLES.PEER_SUPPORTER) {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: 'Only peer supporters can perform this action',
    });
  }
};

/**
 * PEER SUPPORTER ROUTES (Protected)
 */

// Add new availability slot
router.post('/', verifyToken, isPeerSupporter, addAvailability);

// Get my availability slots
router.get('/my-slots', verifyToken, isPeerSupporter, getMyAvailability);

// Update availability slot
router.put('/:availabilityId', verifyToken, isPeerSupporter, updateAvailability);

// Delete availability slot
router.delete('/:availabilityId', verifyToken, isPeerSupporter, deleteAvailability);

// Get availability statistics
router.get('/stats', verifyToken, isPeerSupporter, getAvailabilityStats);

/**
 * PUBLIC ROUTES (For users to browse and book)
 */

// Get available slots for a specific peer supporter
router.get('/counselor/:supporterId', getAvailabilityByCounselor);

// Get all available counselors with optional filters
router.get('/available-counselors', getAvailableCounselors);

// Check if specific time slot is available
router.get('/check', checkAvailability);

export default router;
