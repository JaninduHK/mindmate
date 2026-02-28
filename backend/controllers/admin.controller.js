import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import User from '../models/User.model.js';
import CounselorProfile from '../models/CounselorProfile.model.js';
import Event from '../models/Event.model.js';
import Booking from '../models/Booking.model.js';
import PlatformConfig from '../models/PlatformConfig.model.js';
import { HTTP_STATUS } from '../config/constants.js';

// GET /api/admin/users
export const listUsers = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;
  const filter = {};
  if (req.query.role) filter.role = req.query.role;
  if (req.query.search) {
    filter.$or = [
      { name: { $regex: req.query.search, $options: 'i' } },
      { email: { $regex: req.query.search, $options: 'i' } },
    ];
  }

  const [users, total] = await Promise.all([
    User.find(filter).select('-password').sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);

  res.json(new ApiResponse(HTTP_STATUS.OK, { users, total, page, pages: Math.ceil(total / limit) }));
});

// GET /api/admin/counselors
export const listCounselors = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const [counselors, total] = await Promise.all([
    CounselorProfile.find()
      .populate('userId', 'name email avatar isActive')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    CounselorProfile.countDocuments(),
  ]);

  res.json(new ApiResponse(HTTP_STATUS.OK, { counselors, total, page, pages: Math.ceil(total / limit) }));
});

// PUT /api/admin/counselors/:id/verify  (toggle suspend)
export const toggleCounselorStatus = asyncHandler(async (req, res) => {
  const profile = await CounselorProfile.findOne({ userId: req.params.id });
  if (!profile) throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Counselor not found');

  profile.isSuspended = req.body.isSuspended ?? !profile.isSuspended;
  await profile.save();

  res.json(new ApiResponse(HTTP_STATUS.OK, { profile }, 'Counselor status updated'));
});

// GET /api/admin/events
export const listAllEvents = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;
  const filter = {};
  if (req.query.status) filter.status = req.query.status;

  const [events, total] = await Promise.all([
    Event.find(filter)
      .populate('counselorId', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Event.countDocuments(filter),
  ]);

  res.json(new ApiResponse(HTTP_STATUS.OK, { events, total, page, pages: Math.ceil(total / limit) }));
});

// PUT /api/admin/events/:id/status
export const updateEventStatus = asyncHandler(async (req, res) => {
  const event = await Event.findByIdAndUpdate(
    req.params.id,
    { status: req.body.status },
    { new: true, runValidators: true }
  );
  if (!event) throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Event not found');
  res.json(new ApiResponse(HTTP_STATUS.OK, { event }, 'Event status updated'));
});

// GET /api/admin/bookings
export const listAllBookings = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;
  const filter = {};
  if (req.query.status) filter.status = req.query.status;

  const [bookings, total] = await Promise.all([
    Booking.find(filter)
      .populate('userId', 'name email')
      .populate('eventId', 'title startDate')
      .populate('counselorId', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Booking.countDocuments(filter),
  ]);

  res.json(new ApiResponse(HTTP_STATUS.OK, { bookings, total, page, pages: Math.ceil(total / limit) }));
});

// GET /api/admin/earnings
export const getEarnings = asyncHandler(async (req, res) => {
  const [totalRevenue, platformEarnings, counselorEarnings] = await Promise.all([
    Booking.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$amountPaid' } } },
    ]),
    Booking.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$platformFee' } } },
    ]),
    Booking.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$counselorEarning' } } },
    ]),
  ]);

  res.json(
    new ApiResponse(HTTP_STATUS.OK, {
      totalRevenue: totalRevenue[0]?.total || 0,
      platformEarnings: platformEarnings[0]?.total || 0,
      counselorEarnings: counselorEarnings[0]?.total || 0,
    })
  );
});

// GET /api/admin/config
export const getConfig = asyncHandler(async (req, res) => {
  const config = await PlatformConfig.getConfig();
  res.json(new ApiResponse(HTTP_STATUS.OK, { config }));
});

// PUT /api/admin/config
export const updateConfig = asyncHandler(async (req, res) => {
  const config = await PlatformConfig.getConfig();
  config.commissionRate = req.body.commissionRate;
  config.updatedBy = req.user._id;
  await config.save();
  res.json(new ApiResponse(HTTP_STATUS.OK, { config }, 'Platform config updated'));
});
