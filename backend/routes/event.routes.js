import { Router } from 'express';
import { verifyToken, checkRole } from '../middlewares/auth.middleware.js';
import { USER_ROLES } from '../config/constants.js';
import {
  createEvent,
  listEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  getMyCounselorEvents,
} from '../controllers/event.controller.js';

const router = Router();

// Public
router.get('/', listEvents);

// Protected — counselor only (must be before /:id to avoid route conflict)
router.post(
  '/',
  verifyToken,
  checkRole(USER_ROLES.COUNSELOR, USER_ROLES.ADMIN),
  createEvent
);
router.get(
  '/counselor/me',
  verifyToken,
  checkRole(USER_ROLES.COUNSELOR, USER_ROLES.ADMIN),
  getMyCounselorEvents
);

// Public — by ID (keep after named routes)
router.get('/:id', getEventById);
router.put(
  '/:id',
  verifyToken,
  checkRole(USER_ROLES.COUNSELOR, USER_ROLES.ADMIN),
  updateEvent
);
router.delete(
  '/:id',
  verifyToken,
  checkRole(USER_ROLES.COUNSELOR, USER_ROLES.ADMIN),
  deleteEvent
);

export default router;
