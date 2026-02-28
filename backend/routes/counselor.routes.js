import { Router } from 'express';
import { verifyToken, checkRole } from '../middlewares/auth.middleware.js';
import { USER_ROLES } from '../config/constants.js';
import {
  onboardCounselor,
  getMyProfile,
  updateMyProfile,
  listCounselors,
  getCounselorById,
} from '../controllers/counselor.controller.js';

const router = Router();

// Public
router.get('/', listCounselors);
router.get('/:id', getCounselorById);

// Protected — any authenticated user can onboard as counselor
router.post('/onboard', verifyToken, onboardCounselor);

// Protected — counselor only
router.get(
  '/profile/me',
  verifyToken,
  checkRole(USER_ROLES.COUNSELOR, USER_ROLES.ADMIN),
  getMyProfile
);
router.put(
  '/profile/me',
  verifyToken,
  checkRole(USER_ROLES.COUNSELOR, USER_ROLES.ADMIN),
  updateMyProfile
);

export default router;
