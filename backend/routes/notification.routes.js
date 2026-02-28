import { Router } from 'express';
import { verifyToken } from '../middlewares/auth.middleware.js';
import { getNotifications, markAsRead, markAllAsRead } from '../controllers/notification.controller.js';

const router = Router();

router.use(verifyToken);

router.get('/', getNotifications);
router.put('/read-all', markAllAsRead);
router.put('/:id/read', markAsRead);

export default router;
