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
router.get('/:id', getEventById);

// Protected — counselor only
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
