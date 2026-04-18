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
  syncGuardianRecords,
  debugGuardianData,
} from '../controllers/guardian.controller.js';
import { USER_ROLES } from '../config/constants.js';
import EmergencyContact from '../models/EmergencyContact.model.js';
import GuardianSignup from '../models/GuardianSignup.model.js';
import User from '../models/User.model.js';

const router = express.Router();

// DEBUG endpoints - NO AUTH REQUIRED
router.get('/debug/emergency-contacts', async (req, res) => {
  try {
    const contacts = await EmergencyContact.find().select('ownerUserId contactUserId email fullName inviteStatus relationship').populate('ownerUserId', 'name email _id').populate('contactUserId', 'name email _id');
    res.json({
      count: contacts.length,
      contacts: contacts.map(c => ({
        id: c._id,
        ownerUserId: c.ownerUserId?._id,
        ownerName: c.ownerUserId?.name,
        contactUserId: c.contactUserId?._id,
        contactName: c.contactUserId?.name,
        email: c.email,
        fullName: c.fullName,
        inviteStatus: c.inviteStatus,
        relationship: c.relationship,
      }))
    });
  } catch (error) {
    res.json({ error: error.message });
  }
});

router.get('/debug/guardian-signups', async (req, res) => {
  try {
    const signups = await GuardianSignup.find().select('userId monitoredUserId email signupStatus relationship').populate('userId', 'name email _id').populate('monitoredUserId', 'name email _id');
    res.json({
      count: signups.length,
      signups: signups.map(s => ({
        id: s._id,
        userId: s.userId?._id,
        userName: s.userId?.name,
        monitoredUserId: s.monitoredUserId?._id,
        monitoredUserName: s.monitoredUserId?.name,
        email: s.email,
        signupStatus: s.signupStatus,
        relationship: s.relationship,
      }))
    });
  } catch (error) {
    res.json({ error: error.message });
  }
});

// FIX endpoint - link a guardian to their pending invitation
router.post('/debug/fix-pending-invitation', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    console.log('[DEBUG_FIX] Looking for pending invitation and user for email:', email.toLowerCase());

    // Find the pending invitation
    const emergencyContact = await EmergencyContact.findOne({
      email: email.toLowerCase(),
      inviteStatus: 'pending',
    }).populate('ownerUserId', '_id name email');

    if (!emergencyContact) {
      return res.status(404).json({ error: 'No pending invitation found for this email' });
    }

    console.log('[DEBUG_FIX] Found pending invitation:', emergencyContact._id);

    // Find the user account with this email
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(404).json({ error: 'No user account found with this email. User must sign up first.' });
    }

    console.log('[DEBUG_FIX] Found user account:', user._id);

    // Link the emergency contact
    emergencyContact.contactUserId = user._id;
    emergencyContact.inviteStatus = 'accepted';
    emergencyContact.acceptedAt = new Date();
    await emergencyContact.save();

    console.log('[DEBUG_FIX] Updated EmergencyContact:', {
      id: emergencyContact._id,
      contactUserId: emergencyContact.contactUserId,
      inviteStatus: emergencyContact.inviteStatus,
    });

    // Create GuardianSignup record
    const guardianSignup = await GuardianSignup.create({
      userId: user._id,
      emergencyContactId: emergencyContact._id,
      monitoredUserId: emergencyContact.ownerUserId._id,
      fullName: user.name,
      email: user.email,
      relationship: emergencyContact.relationship,
      invitationToken: 'fixed-' + user._id,
      inviteTokenHash: 'fixed-' + user._id,
      tokenVerifiedAt: new Date(),
      signupStatus: 'verified',
      emailVerified: true,
      signupCompletedAt: new Date(),
      consentsToMonitoring: true,
    });

    console.log('[DEBUG_FIX] Created GuardianSignup:', guardianSignup._id);

    res.json({
      success: true,
      message: 'Invitation linked successfully',
      emergencyContact: {
        id: emergencyContact._id,
        contactUserId: emergencyContact.contactUserId,
        inviteStatus: emergencyContact.inviteStatus,
      },
      guardianSignup: {
        id: guardianSignup._id,
        userId: guardianSignup.userId,
        monitoredUserId: guardianSignup.monitoredUserId,
      },
    });
  } catch (error) {
    console.error('[DEBUG_FIX] Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// All routes below require emergency_contact role
router.use(verifyToken);
router.use(checkRole(USER_ROLES.EMERGENCY_CONTACT));

// DEBUG endpoint - check guardian's data
router.get('/debug/data', debugGuardianData);

// Get all users this emergency contact is monitoring
router.get('/users-status', getGuardianUsersStatus);

// Get detailed status of a specific user
router.get('/users/:userId', getGuardianUserDetail);

// NEW: Sync guardian records - creates missing GuardianSignup records
router.post('/sync', syncGuardianRecords);

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
