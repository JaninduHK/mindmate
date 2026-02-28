import { Router } from 'express';
import { verifyToken, checkRole } from '../middlewares/auth.middleware.js';
import { USER_ROLES } from '../config/constants.js';
import { getBalance, getMyWithdrawals, createWithdrawal } from '../controllers/withdrawal.controller.js';

const router = Router();

router.use(verifyToken, checkRole(USER_ROLES.COUNSELOR));

router.get('/balance', getBalance);
router.get('/my', getMyWithdrawals);
router.post('/', createWithdrawal);

export default router;
