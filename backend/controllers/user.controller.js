import User from '../models/User.model.js';
import RefreshToken from '../models/RefreshToken.model.js';
import { cloudinary } from '../config/cloudinary.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import { HTTP_STATUS } from '../config/constants.js';

// Get all regular users (for peer supporters to help)
export const getUsers = asyncHandler(async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find({ role: 'user', isActive: true })
        .select('name email avatar username')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments({ role: 'user', isActive: true }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        users,
        total,
        page,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
    });
  }
});

// Get user profile
export const getProfile = asyncHandler(async (req, res) => {
  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, { user: req.user.toPublicJSON() }, 'Profile retrieved successfully')
  );
});

// Update user profile
export const updateProfile = asyncHandler(async (req, res) => {
  const { name, email } = req.body;
  const user = await User.findById(req.user._id);

  if (!user) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'User not found');
  }

  // Check if email is being changed and if it's already taken
  if (email && email !== user.email) {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new ApiError(HTTP_STATUS.CONFLICT, 'Email already in use');
    }
    user.email = email;
  }

  if (name) {
    user.name = name;
  }

  await user.save();

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, { user: user.toPublicJSON() }, 'Profile updated successfully')
  );
});

// Change password
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id).select('+password');

  if (!user) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'User not found');
  }

  // Verify current password
  const isPasswordValid = await user.comparePassword(currentPassword);

  if (!isPasswordValid) {
    throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Current password is incorrect');
  }

  // Update password
  user.password = newPassword;
  await user.save();

  // Revoke all refresh tokens for security
  await RefreshToken.updateMany(
    { userId: user._id, revokedAt: null },
    { revokedAt: new Date(), revokedByIp: req.ip }
  );

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, null, 'Password changed successfully. Please login again.')
  );
});

// Delete account
export const deleteAccount = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'User not found');
  }

  // Delete avatar from Cloudinary if exists
  if (user.avatar.publicId) {
    try {
      await cloudinary.uploader.destroy(user.avatar.publicId);
    } catch (error) {
      console.error('Error deleting avatar from Cloudinary:', error);
    }
  }

  // Delete all refresh tokens
  await RefreshToken.deleteMany({ userId: user._id });

  // Delete user
  await user.deleteOne();

  // Clear cookie
  const isProd = process.env.NODE_ENV === 'production';
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    path: '/',
  });

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, null, 'Account deleted successfully')
  );
});

// Toggle availability status for peer counselors
export const toggleAvailabilityNow = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'User not found');
  }

  if (user.role !== 'peer_supporter') {
    throw new ApiError(HTTP_STATUS.FORBIDDEN, 'Only peer supporters can toggle availability');
  }

  // Toggle availability
  user.isAvailableNow = !user.isAvailableNow;
  user.lastAvailableToggle = new Date();
  await user.save();

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(
      HTTP_STATUS.OK,
      {
        isAvailableNow: user.isAvailableNow,
        message: user.isAvailableNow ? 'You are now available' : 'You are now unavailable'
      },
      user.isAvailableNow ? 'Status updated to available' : 'Status updated to unavailable'
    )
  );
});

// Get peer counselor availability status
export const getAvailabilityStatus = asyncHandler(async (req, res) => {
  const { peerId } = req.params;

  const peer = await User.findById(peerId).select('isAvailableNow name email avatar role');

  if (!peer || peer.role !== 'peer_supporter') {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Peer counselor not found');
  }

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, {
      peerId: peer._id,
      name: peer.name,
      email: peer.email,
      avatar: peer.avatar,
      isAvailableNow: peer.isAvailableNow,
    })
  );
});
