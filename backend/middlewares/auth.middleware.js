import { verifyAccessToken } from '../utils/jwt.util.js';
import User from '../models/User.model.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { HTTP_STATUS, USER_ROLES } from '../config/constants.js';

export const verifyToken = asyncHandler(async (req, res, next) => {
  // Get token from header
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Access token is required');
  }

  const token = authHeader.split(' ')[1];

  try {
    // Verify token
    const decoded = verifyAccessToken(token);

    // Find user
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'User not found');
    }

    if (!user.isActive) {
      throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'User account is inactive');
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    if (error.message.includes('expired')) {
      throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Access token has expired');
    }
    throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Invalid access token');
  }
});

export const checkRole = (...allowedRoles) => {
  return asyncHandler(async (req, res, next) => {
    if (!req.user) {
      throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Authentication required');
    }

    if (!allowedRoles.includes(req.user.role)) {
      throw new ApiError(
        HTTP_STATUS.FORBIDDEN,
        'You do not have permission to access this resource'
      );
    }

    next();
  });
};
