import express from 'express';
import {
  register,
  registerPeerSupporter,
  guardianSignup,
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

// Rate limiter for auth endpoints (disabled in development)
const authLimiter = rateLimit({
  windowMs: RATE_LIMIT_CONFIG.WINDOW_MS,
  max: RATE_LIMIT_CONFIG.AUTH_MAX_REQUESTS,
  message: 'Too many authentication attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV !== 'production',
});

// Public routes
router.post('/register', authLimiter, validate(registerSchema), register);
router.post('/register/peer-supporter', authLimiter, validate(registerSchema), registerPeerSupporter);
router.post('/guardian-signup', authLimiter, validate(registerSchema), guardianSignup);
router.post('/login', authLimiter, validate(loginSchema), login);
router.post('/refresh', refreshAccessToken);
router.post('/logout', logout);

// Protected routes
router.get('/me', verifyToken, getCurrentUser);

export default router;
