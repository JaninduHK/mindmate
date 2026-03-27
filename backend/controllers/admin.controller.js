import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import User from '../models/User.model.js';
import CounselorProfile from '../models/CounselorProfile.model.js';
import PeerSupporterProfile from '../models/PeerSupporterProfile.model.js';
import Event from '../models/Event.model.js';
import Booking from '../models/Booking.model.js';
import PlatformConfig from '../models/PlatformConfig.model.js';
import { sendNotification } from '../services/notification.service.js';
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
  if (req.body.commissionRate !== undefined) config.commissionRate = req.body.commissionRate;
  if (req.body.bankDetails) config.bankDetails = { ...config.bankDetails.toObject?.() ?? config.bankDetails, ...req.body.bankDetails };
  config.updatedBy = req.user._id;
  await config.save();
  res.json(new ApiResponse(HTTP_STATUS.OK, { config }, 'Platform config updated'));
});

// POST /api/admin/bookings/:id/confirm-bank-transfer
export const confirmBankTransfer = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Booking not found');
  if (booking.paymentMethod !== 'bank_transfer') {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Not a bank transfer booking');
  }
  if (booking.status !== 'pending') {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Booking is not in pending state');
  }

  booking.status = 'confirmed';
  booking.paymentStatus = 'paid';
  await booking.save();

  await Event.findByIdAndUpdate(booking.eventId, { $inc: { seatsAvailable: -1 } });

  const eventDoc = await Event.findById(booking.eventId);
  await sendNotification({
    userId: booking.userId,
    type: 'booking_confirmed',
    title: 'Booking Confirmed',
    message: `Your bank transfer for "${eventDoc?.title}" has been verified and your booking is confirmed!`,
    data: { bookingId: booking._id, eventId: booking.eventId },
  });
  await sendNotification({
    userId: booking.counselorId,
    type: 'payment_received',
    title: 'New Booking',
    message: `You have a new booking for "${eventDoc?.title}" (bank transfer).`,
    data: { bookingId: booking._id, eventId: booking.eventId },
  });

  res.json(new ApiResponse(HTTP_STATUS.OK, { booking }, 'Bank transfer confirmed'));
});

// POST /api/admin/bookings/:id/reject-bank-transfer
export const rejectBankTransfer = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Booking not found');
  if (booking.paymentMethod !== 'bank_transfer') {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Not a bank transfer booking');
  }
  if (booking.status !== 'pending') {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Booking is not in pending state');
  }

  booking.status = 'cancelled';
  booking.paymentStatus = 'failed';
  booking.cancellationReason = req.body.reason || 'Bank transfer rejected by admin';
  await booking.save();

  const eventDoc = await Event.findById(booking.eventId);
  await sendNotification({
    userId: booking.userId,
    type: 'booking_cancelled',
    title: 'Payment Not Verified',
    message: `Your bank transfer for "${eventDoc?.title}" could not be verified. Please contact support.`,
    data: { bookingId: booking._id, eventId: booking.eventId },
  });

  res.json(new ApiResponse(HTTP_STATUS.OK, { booking }, 'Bank transfer rejected'));
});

// GET /api/admin/peer-supporters/pending
export const listPendingPeerSupporters = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const [peerSupporters, total] = await Promise.all([
    PeerSupporterProfile.find({ isVerified: false })
      .populate('userId', 'name email avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    PeerSupporterProfile.countDocuments({ isVerified: false }),
  ]);

  res.json(
    new ApiResponse(HTTP_STATUS.OK, { peerSupporters, total, page, pages: Math.ceil(total / limit) })
  );
});

// GET /api/admin/peer-supporters
export const listAllPeerSupporters = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const [peerSupporters, total] = await Promise.all([
    PeerSupporterProfile.find()
      .populate('userId', 'name email avatar isActive')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    PeerSupporterProfile.countDocuments(),
  ]);

  res.json(
    new ApiResponse(HTTP_STATUS.OK, { peerSupporters, total, page, pages: Math.ceil(total / limit) })
  );
});

// PUT /api/admin/peer-supporters/:id/approve
export const approvePeerSupporter = asyncHandler(async (req, res) => {
  const profile = await PeerSupporterProfile.findById(req.params.id);
  if (!profile) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Peer supporter not found');
  }

  profile.isVerified = true;
  profile.rejectionReason = null;
  await profile.save();

  const user = await User.findById(profile.userId);
  await sendNotification({
    userId: user._id,
    type: 'peer_supporter_approved',
    title: 'Account Approved',
    message: 'Your peer supporter account has been approved! You can now help others in the community.',
    data: { userId: user._id },
  });

  res.json(
    new ApiResponse(HTTP_STATUS.OK, { profile }, 'Peer supporter approved')
  );
});

// PUT /api/admin/peer-supporters/:id/reject
export const rejectPeerSupporter = asyncHandler(async (req, res) => {
  const profile = await PeerSupporterProfile.findById(req.params.id);
  if (!profile) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Peer supporter not found');
  }

  profile.rejectionReason = req.body.reason || 'Application rejected';
  await profile.save();

  // Optionally, you can keep the user but mark them as inactive
  // await User.findByIdAndUpdate(profile.userId, { isActive: false });

  const user = await User.findById(profile.userId);
  await sendNotification({
    userId: user._id,
    type: 'peer_supporter_rejected',
    title: 'Application Not Approved',
    message: `Your peer supporter application was not approved. Reason: ${profile.rejectionReason}`,
    data: { userId: user._id },
  });

  res.json(
    new ApiResponse(HTTP_STATUS.OK, { profile }, 'Peer supporter application rejected')
  );
});
