import express from 'express';
import { uploadImage, deleteImage } from '../controllers/upload.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';
import upload, { handleMulterError } from '../middlewares/upload.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

router.post('/image', upload.single('image'), handleMulterError, uploadImage);
router.delete('/image', deleteImage);

export default router;
