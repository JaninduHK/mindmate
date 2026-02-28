import { Router } from 'express';
import { verifyToken, checkRole } from '../middlewares/auth.middleware.js';
import { USER_ROLES } from '../config/constants.js';
import {
  listUsers,
  listCounselors,
  toggleCounselorStatus,
  listAllEvents,
  updateEventStatus,
  listAllBookings,
  getEarnings,
  getConfig,
  updateConfig,
} from '../controllers/admin.controller.js';
import { listWithdrawals, processWithdrawal } from '../controllers/withdrawal.controller.js';

const router = Router();

router.use(verifyToken, checkRole(USER_ROLES.ADMIN));

router.get('/users', listUsers);
router.get('/counselors', listCounselors);
router.put('/counselors/:id/verify', toggleCounselorStatus);
router.get('/events', listAllEvents);
router.put('/events/:id/status', updateEventStatus);
router.get('/bookings', listAllBookings);
router.get('/earnings', getEarnings);
router.get('/config', getConfig);
router.put('/config', updateConfig);
router.get('/withdrawals', listWithdrawals);
router.put('/withdrawals/:id', processWithdrawal);

export default router;
