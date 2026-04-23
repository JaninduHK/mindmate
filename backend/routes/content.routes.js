import { Router } from 'express';
import { verifyToken, checkRole } from '../middlewares/auth.middleware.js';
import { USER_ROLES } from '../config/constants.js';
import {
  getAllContent,
  createContent,
  updateContent,
  deleteContent
} from '../controllers/content.controller.js';

const router = Router();

// Publicly or conditionally accessible to registered users
router.get('/', verifyToken, getAllContent);

// Only counselors or admins can modify content
router.post('/', verifyToken, checkRole(USER_ROLES.COUNSELOR, USER_ROLES.ADMIN, USER_ROLES.PEER_SUPPORTER), createContent);
router.put('/:id', verifyToken, checkRole(USER_ROLES.COUNSELOR, USER_ROLES.ADMIN, USER_ROLES.PEER_SUPPORTER), updateContent);
router.delete('/:id', verifyToken, checkRole(USER_ROLES.COUNSELOR, USER_ROLES.ADMIN, USER_ROLES.PEER_SUPPORTER), deleteContent);

export default router;
