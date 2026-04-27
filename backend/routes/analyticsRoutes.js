import { Router } from 'express';

import { verifyToken } from '../middlewares/auth.middleware.js';
import {
  getAnalyticsSummary,
  checkReportRange,
  downloadAnalyticsReport,
} from '../controllers/analyticsController.js';

const router = Router();

router.get('/summary', verifyToken, getAnalyticsSummary);
router.get('/report-range-check', verifyToken, checkReportRange);
router.get('/report-download', verifyToken, downloadAnalyticsReport);

export default router;

