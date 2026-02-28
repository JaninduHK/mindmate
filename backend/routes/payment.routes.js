import { Router } from 'express';
import { verifyToken, checkRole } from '../middlewares/auth.middleware.js';
import { USER_ROLES } from '../config/constants.js';
import { stripeWebhook, getConnectOnboardingUrl, getConnectStatus } from '../controllers/payment.controller.js';

const router = Router();

// Stripe webhook — raw body handled in server.js before express.json()
router.post('/webhook', stripeWebhook);

// Protected — counselor only
router.get(
  '/connect/onboard',
  verifyToken,
  checkRole(USER_ROLES.COUNSELOR, USER_ROLES.ADMIN),
  getConnectOnboardingUrl
);
router.get(
  '/connect/status',
  verifyToken,
  checkRole(USER_ROLES.COUNSELOR, USER_ROLES.ADMIN),
  getConnectStatus
);

export default router;
