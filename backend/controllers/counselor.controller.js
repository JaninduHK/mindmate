import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import CounselorProfile from '../models/CounselorProfile.model.js';
import User from '../models/User.model.js';
import { HTTP_STATUS, USER_ROLES } from '../config/constants.js';

// POST /api/counselor/onboard
export const onboardCounselor = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // Promote user role to counselor
  await User.findByIdAndUpdate(userId, { role: USER_ROLES.COUNSELOR });

  const existing = await CounselorProfile.findOne({ userId });
  if (existing) {
    throw new ApiError(HTTP_STATUS.CONFLICT, 'Counselor profile already exists');
  }

  const { bio, specializations, certifications, languages } = req.body;

  const profile = await CounselorProfile.create({
    userId,
    bio,
    specializations: specializations || [],
    certifications: certifications || [],
    languages: languages || ['English'],
    isVerified: true,
  });

  res
    .status(HTTP_STATUS.CREATED)
    .json(new ApiResponse(HTTP_STATUS.CREATED, { profile }, 'Counselor profile created'));
});

// GET /api/counselor/profile  (own profile)
export const getMyProfile = asyncHandler(async (req, res) => {
  const profile = await CounselorProfile.findOne({ userId: req.user._id }).populate(
    'userId',
    'name email avatar'
  );
  if (!profile) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Counselor profile not found');
  }
  res.json(new ApiResponse(HTTP_STATUS.OK, { profile }, 'Profile fetched'));
});

// PUT /api/counselor/profile
export const updateMyProfile = asyncHandler(async (req, res) => {
  const { bio, specializations, certifications, languages } = req.body;

  const profile = await CounselorProfile.findOneAndUpdate(
    { userId: req.user._id },
    { bio, specializations, certifications, languages },
    { new: true, runValidators: true }
  );

  if (!profile) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Counselor profile not found');
  }

  res.json(new ApiResponse(HTTP_STATUS.OK, { profile }, 'Profile updated'));
});

// GET /api/counselors  (public listing)
export const listCounselors = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 12;
  const skip = (page - 1) * limit;

  const filter = { isVerified: true, isSuspended: false };
  if (req.query.specialization) {
    filter.specializations = req.query.specialization;
  }

  const [counselors, total] = await Promise.all([
    CounselorProfile.find(filter)
      .populate('userId', 'name avatar')
      .sort({ rating: -1, reviewCount: -1 })
      .skip(skip)
      .limit(limit),
    CounselorProfile.countDocuments(filter),
  ]);

  res.json(
    new ApiResponse(HTTP_STATUS.OK, { counselors, total, page, pages: Math.ceil(total / limit) })
  );
});

// GET /api/counselors/:id  (public)
export const getCounselorById = asyncHandler(async (req, res) => {
  const profile = await CounselorProfile.findOne({
    userId: req.params.id,
    isSuspended: false,
  }).populate('userId', 'name email avatar');

  if (!profile) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Counselor not found');
  }

  res.json(new ApiResponse(HTTP_STATUS.OK, { profile }));
});
