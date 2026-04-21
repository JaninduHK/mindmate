import express from 'express';
import {
  triggerEmergencyAlert,
  triggerCrisisMode,
  getEmergencyAlertHistory,
} from '../../controllers/emergency/emergency.controller.js';
import { verifyToken } from '../../middlewares/auth.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

/**
 * POST /api/emergency/trigger
 * Trigger an emergency alert - sends notification to all accepted emergency contacts
 * Body: { message?, location? }
 */
router.post('/trigger', triggerEmergencyAlert);

/**
 * POST /api/emergency/crisis-mode
 * Activate crisis mode - sends detailed alerts to all emergency contacts
 * Body: { message (required), location?, severity?, details? }
 */
router.post('/crisis-mode', triggerCrisisMode);

/**
 * GET /api/emergency/history
 * Get history of emergency alerts sent
 * Query: { limit?, page? }
 */
router.get('/history', getEmergencyAlertHistory);

export default router;
