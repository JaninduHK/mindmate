import { Router } from 'express';
import {
  createSession,
  getMySessions,
  getPeerIncomingSessions,
  updateSessionStatus,
} from '../controllers/peerSession.controller.js';

const router = Router();

router.post('/', createSession);
router.get('/my', getMySessions);
router.get('/counselor', getPeerIncomingSessions);
router.patch('/:id/status', updateSessionStatus);

export default router;
