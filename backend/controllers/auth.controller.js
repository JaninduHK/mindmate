import User from '../models/User.model.js';
import RefreshToken from '../models/RefreshToken.model.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt.util.js';
import { generateUsername } from '../utils/username.util.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import { HTTP_STATUS, JWT_CONFIG } from '../config/constants.js';

// Helper function to set refresh token cookie
const setRefreshTokenCookie = (res, token) => {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

// Register new user
export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(HTTP_STATUS.CONFLICT, 'Email already registered');
  }

  // Generate a unique friendly username (retry on collision)
  let username;
  for (let i = 0; i < 5; i++) {
    const candidate = generateUsername();
    const exists = await User.findOne({ username: candidate }).select('_id');
    if (!exists) { username = candidate; break; }
  }
  if (!username) username = generateUsername(); // fallback — collision is extremely rare

  // Create user
  const user = await User.create({
    name,
    email,
    password,
    username,
  });

  // Generate tokens
  const accessToken = generateAccessToken({ userId: user._id });
  const refreshToken = generateRefreshToken({ userId: user._id });

  // Save refresh token to database
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  await RefreshToken.create({
    userId: user._id,
    token: refreshToken,
    expiresAt,
    createdByIp: req.ip,
  });

  // Set refresh token cookie
  setRefreshTokenCookie(res, refreshToken);

  res.status(HTTP_STATUS.CREATED).json(
    new ApiResponse(
      HTTP_STATUS.CREATED,
      {
        user: user.toPublicJSON(),
        accessToken,
      },
      'User registered successfully'
    )
  );
});

// Login user
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Find user with password field
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Invalid email or password');
  }

  // Check if user is active
  if (!user.isActive) {
    throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Your account has been deactivated');
  }

  // Verify password
  const isPasswordValid = await user.comparePassword(password);

  if (!isPasswordValid) {
    throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Invalid email or password');
  }

  // Generate tokens
  const accessToken = generateAccessToken({ userId: user._id });
  const refreshToken = generateRefreshToken({ userId: user._id });

  // Save refresh token to database
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  await RefreshToken.create({
    userId: user._id,
    token: refreshToken,
    expiresAt,
    createdByIp: req.ip,
  });

  // Update last login
  user.lastLogin = new Date();
  await user.save();

  // Set refresh token cookie
  setRefreshTokenCookie(res, refreshToken);

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(
      HTTP_STATUS.OK,
      {
        user: user.toPublicJSON(),
        accessToken,
      },
      'Login successful'
    )
  );
});

// Refresh access token
export const refreshAccessToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.cookies;

  if (!refreshToken) {
    throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Refresh token is required');
  }

  // Verify refresh token
  let decoded;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch (error) {
    throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Invalid or expired refresh token');
  }

  // Find refresh token in database
  const storedToken = await RefreshToken.findOne({ token: refreshToken, userId: decoded.userId });

  if (!storedToken || !storedToken.isActive()) {
    throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Refresh token is invalid or has been revoked');
  }

  // Find user
  const user = await User.findById(decoded.userId);

  if (!user || !user.isActive) {
    throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'User not found or inactive');
  }

  // Generate new tokens
  const newAccessToken = generateAccessToken({ userId: user._id });
  const newRefreshToken = generateRefreshToken({ userId: user._id });

  // Save new refresh token
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await RefreshToken.create({
    userId: user._id,
    token: newRefreshToken,
    expiresAt,
    createdByIp: req.ip,
  });

  // Revoke old refresh token
  storedToken.revokedAt = new Date();
  storedToken.revokedByIp = req.ip;
  storedToken.replacedByToken = newRefreshToken;
  await storedToken.save();

  // Set new refresh token cookie
  setRefreshTokenCookie(res, newRefreshToken);

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(
      HTTP_STATUS.OK,
      {
        accessToken: newAccessToken,
      },
      'Token refreshed successfully'
    )
  );
});

// Logout user
export const logout = asyncHandler(async (req, res) => {
  const { refreshToken } = req.cookies;

  if (refreshToken) {
    // Revoke refresh token
    const storedToken = await RefreshToken.findOne({ token: refreshToken });

    if (storedToken) {
      storedToken.revokedAt = new Date();
      storedToken.revokedByIp = req.ip;
      await storedToken.save();
    }
  }

  // Clear cookie
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });

  res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, null, 'Logout successful'));
});

// Get current user (for verifying token)
export const getCurrentUser = asyncHandler(async (req, res) => {
  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, { user: req.user.toPublicJSON() }, 'User retrieved successfully')
  );
});
