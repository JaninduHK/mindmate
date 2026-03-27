import { Router } from 'express';
import {
  listPeerSupporters,
  getPeerSupporterById,
} from '../controllers/peerSupporter.controller.js';

const router = Router();

// Public routes
router.get('/', listPeerSupporters);
router.get('/:id', getPeerSupporterById);

export default router;
