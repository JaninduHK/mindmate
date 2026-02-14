import express from 'express';
import {
  register,
  login,
  refreshAccessToken,
  logout,
  getCurrentUser,
} from '../controllers/auth.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';
import validate from '../middlewares/validate.middleware.js';
import { registerSchema, loginSchema } from '../utils/validation.util.js';
import rateLimit from 'express-rate-limit';
import { RATE_LIMIT_CONFIG } from '../config/constants.js';

const router = express.Router();

// Rate limiter for auth endpoints
const authLimiter = rateLimit({
  windowMs: RATE_LIMIT_CONFIG.WINDOW_MS,
  max: RATE_LIMIT_CONFIG.AUTH_MAX_REQUESTS,
  message: 'Too many authentication attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// Public routes
router.post('/register', authLimiter, validate(registerSchema), register);
router.post('/login', authLimiter, validate(loginSchema), login);
router.post('/refresh', refreshAccessToken);
router.post('/logout', logout);

// Protected routes
router.get('/me', verifyToken, getCurrentUser);

export default router;
