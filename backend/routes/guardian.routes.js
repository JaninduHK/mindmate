import express from 'express';
import { verifyToken, checkRole } from '../middlewares/auth.middleware.js';
import {
  getGuardianUsersStatus,
  getGuardianUserDetail,
  getGuardianDashboard,
  getHighRiskAlerts,
  acknowledgeRiskAlert,
  contactUser,
  getMonitoredUsers,
  getUserMoodAnalytics,
  getUserGoalAnalytics,
  getMoodAlerts,
  getDailyAnalytics,
  getAnalyticsSummary,
} from '../controllers/guardian.controller.js';
import { USER_ROLES } from '../config/constants.js';

const router = express.Router();

// All routes require emergency_contact role
router.use(verifyToken);
router.use(checkRole(USER_ROLES.EMERGENCY_CONTACT));

// Get all users this emergency contact is monitoring
router.get('/users-status', getGuardianUsersStatus);

// Get detailed status of a specific user
router.get('/users/:userId', getGuardianUserDetail);

// NEW: Get all monitored users
router.get('/monitored-users', getMonitoredUsers);

// NEW: Get guardian dashboard data for a specific user
router.get('/dashboard/:userId', getGuardianDashboard);

// NEW: Get all high-risk alerts
router.get('/alerts/high-risk', getHighRiskAlerts);

// NEW: Acknowledge a risk alert
router.post('/alerts/:alertId/acknowledge', acknowledgeRiskAlert);

// NEW: Contact a user (send notification)
router.post('/:userId/contact', contactUser);

// NEW: Get mood analytics for a user
router.get('/:userId/moods/analytics', getUserMoodAnalytics);

// NEW: Get mood alerts/warnings for a user
router.get('/:userId/moods/alerts', getMoodAlerts);

// NEW: Get daily analytics for a user
router.get('/:userId/daily-analytics', getDailyAnalytics);

// NEW: Get goal analytics for a user
router.get('/:userId/goals/analytics', getUserGoalAnalytics);

// NEW: Get analytics summary for a user
router.get('/:userId/analytics/summary', getAnalyticsSummary);

export default router;
