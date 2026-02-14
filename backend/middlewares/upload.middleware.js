import multer from 'multer';
import ApiError from '../utils/ApiError.js';
import { UPLOAD_CONFIG, HTTP_STATUS } from '../config/constants.js';

// Use memory storage (file will be in req.file.buffer)
const storage = multer.memoryStorage();

// File filter
const fileFilter = (req, file, cb) => {
  if (UPLOAD_CONFIG.ALLOWED_FILE_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        `Invalid file type. Allowed types: ${UPLOAD_CONFIG.ALLOWED_FILE_TYPES.join(', ')}`
      ),
      false
    );
  }
};

// Multer configuration
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: UPLOAD_CONFIG.MAX_FILE_SIZE,
  },
});

// Error handler for multer
export const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return next(
        new ApiError(
          HTTP_STATUS.BAD_REQUEST,
          `File size too large. Maximum size is ${UPLOAD_CONFIG.MAX_FILE_SIZE / 1024 / 1024}MB`
        )
      );
    }
    return next(new ApiError(HTTP_STATUS.BAD_REQUEST, err.message));
  }
  next(err);
};

export default upload;
