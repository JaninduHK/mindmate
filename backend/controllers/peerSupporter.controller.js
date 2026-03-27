import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import User from '../models/User.model.js';
import { HTTP_STATUS } from '../config/constants.js';

// GET /api/peer-supporters  (public listing)
export const listPeerSupporters = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 12;
  const skip = (page - 1) * limit;

  const filter = { role: 'peer_supporter', isActive: true };

  const [peerSupporters, total] = await Promise.all([
    User.find(filter)
      .select('name email avatar isAvailableNow')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    User.countDocuments(filter),
  ]);

  res.json(
    new ApiResponse(HTTP_STATUS.OK, { peerSupporters, total, page, pages: Math.ceil(total / limit) })
  );
});

// GET /api/peer-supporters/:id  (public)
export const getPeerSupporterById = asyncHandler(async (req, res) => {
  const profile = await User.findOne({
    _id: req.params.id,
    role: 'peer_supporter',
    isActive: true,
  }).select('name email avatar isAvailableNow');

  if (!profile) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Peer supporter not found');
  }

  res.json(new ApiResponse(HTTP_STATUS.OK, { profile }));
});
