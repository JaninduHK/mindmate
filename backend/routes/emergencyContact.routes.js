import express from 'express';
import { verifyToken } from '../middlewares/auth.middleware.js';
import {
  getEmergencyContacts,
  getEmergencyContact,
  addEmergencyContact,
  updateEmergencyContact,
  deleteEmergencyContact,
  resendEmergencyInvite,
} from '../controllers/emergencyContact.controller.js';

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

// Get all emergency contacts
router.get('/', getEmergencyContacts);

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

export default router;
