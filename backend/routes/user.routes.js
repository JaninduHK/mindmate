import express from 'express';
import {
  getProfile,
  updateProfile,
  changePassword,
  deleteAccount,
} from '../controllers/user.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';
import validate from '../middlewares/validate.middleware.js';
import { updateProfileSchema, changePasswordSchema } from '../utils/validation.util.js';

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

router.get('/profile', getProfile);
router.put('/profile', validate(updateProfileSchema), updateProfile);
router.put('/password', validate(changePasswordSchema), changePassword);
router.delete('/account', deleteAccount);

export default router;
