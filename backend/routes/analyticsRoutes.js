import { Router } from 'express';

import { verifyToken } from '../middlewares/auth.middleware.js';
import { getAnalyticsSummary } from '../controllers/analyticsController.js';

const router = Router();

router.get('/summary', verifyToken, getAnalyticsSummary);

export default router;

