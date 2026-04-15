import express from 'express';
import { verifyToken } from '../middlewares/auth.middleware.js';
import {
  getEmergencyContacts,
  getEmergencyContact,
  addEmergencyContact,
  updateEmergencyContact,
  deleteEmergencyContact,
  resendEmergencyInvite,
  getMonitoredUsers,
  acceptEmergencyContactInvitation,
} from '../controllers/emergencyContact.controller.js';

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

// Get all emergency contacts (for users to see who they've added)
router.get('/', getEmergencyContacts);

// Get all monitored users (for guardians to see who they monitor)
router.get('/guardian/monitored', getMonitoredUsers);

// Get single emergency contact
router.get('/:id', getEmergencyContact);

// Add new emergency contact
router.post('/', addEmergencyContact);

// Update emergency contact
router.put('/:id', updateEmergencyContact);

// Delete emergency contact
router.delete('/:id', deleteEmergencyContact);

// Resend invitation
router.post('/:id/resend-invite', resendEmergencyInvite);

// Accept invitation with token
router.post('/accept/invitation', acceptEmergencyContactInvitation);

export default router;
