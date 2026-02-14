import { cloudinary } from '../config/cloudinary.js';
import User from '../models/User.model.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import { HTTP_STATUS, UPLOAD_CONFIG } from '../config/constants.js';

// Helper function to upload to Cloudinary
const uploadToCloudinary = (buffer, folder) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'auto',
        transformation: [
          { width: 500, height: 500, crop: 'limit' },
          { quality: 'auto' },
          { fetch_format: 'auto' },
        ],
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    );

    uploadStream.end(buffer);
  });
};

// Upload profile image
export const uploadImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'No file uploaded');
  }

  const user = await User.findById(req.user._id);

  if (!user) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'User not found');
  }

  // Delete old avatar from Cloudinary if exists
  if (user.avatar.publicId) {
    try {
      await cloudinary.uploader.destroy(user.avatar.publicId);
    } catch (error) {
      console.error('Error deleting old avatar:', error);
    }
  }

  // Upload new image to Cloudinary
  const folder = `${UPLOAD_CONFIG.CLOUDINARY_FOLDER}/${user._id}`;
  const result = await uploadToCloudinary(req.file.buffer, folder);

  // Update user avatar
  user.avatar = {
    url: result.secure_url,
    publicId: result.public_id,
  };

  await user.save();

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(
      HTTP_STATUS.OK,
      {
        avatar: user.avatar,
      },
      'Image uploaded successfully'
    )
  );
});

// Delete profile image
export const deleteImage = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'User not found');
  }

  if (!user.avatar.publicId) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'No profile image to delete');
  }

  // Delete from Cloudinary
  try {
    await cloudinary.uploader.destroy(user.avatar.publicId);
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    throw new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Failed to delete image');
  }

  // Update user avatar
  user.avatar = {
    url: '',
    publicId: '',
  };

  await user.save();

  res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, null, 'Image deleted successfully'));
});
