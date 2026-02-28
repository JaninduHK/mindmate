import { Router } from 'express';
import { verifyToken, checkRole } from '../middlewares/auth.middleware.js';
import { USER_ROLES } from '../config/constants.js';
import { getOverview, getBookingTrends } from '../controllers/analytics.controller.js';

const router = Router();

router.use(verifyToken, checkRole(USER_ROLES.COUNSELOR, USER_ROLES.ADMIN));

router.get('/overview', getOverview);
router.get('/bookings', getBookingTrends);

export default router;
