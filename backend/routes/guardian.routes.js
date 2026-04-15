import express from 'express';
import { verifyToken, checkRole } from '../middlewares/auth.middleware.js';
import {
  getGuardianUsersStatus,
  getGuardianUserDetail,
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

export default router;
