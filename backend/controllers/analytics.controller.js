import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import Booking from '../models/Booking.model.js';
import Event from '../models/Event.model.js';
import CounselorProfile from '../models/CounselorProfile.model.js';
import { HTTP_STATUS } from '../config/constants.js';

// GET /api/analytics/overview  (counselor)
export const getOverview = asyncHandler(async (req, res) => {
  const counselorId = req.user._id;

  const [totalBookings, confirmedBookings, totalRevenue, profile, events] = await Promise.all([
    Booking.countDocuments({ counselorId }),
    Booking.countDocuments({ counselorId, status: 'confirmed' }),
    Booking.aggregate([
      { $match: { counselorId: counselorId, paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$counselorEarning' } } },
    ]),
    CounselorProfile.findOne({ userId: counselorId }),
    Event.countDocuments({ counselorId }),
  ]);

  res.json(
    new ApiResponse(HTTP_STATUS.OK, {
      totalBookings,
      confirmedBookings,
      totalRevenue: totalRevenue[0]?.total || 0,
      rating: profile?.rating || 0,
      reviewCount: profile?.reviewCount || 0,
      totalEvents: events,
    })
  );
});

// GET /api/analytics/bookings  (counselor)
export const getBookingTrends = asyncHandler(async (req, res) => {
  const counselorId = req.user._id;
  const days = parseInt(req.query.days) || 30;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const trends = await Booking.aggregate([
    {
      $match: {
        counselorId: counselorId,
        createdAt: { $gte: since },
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        count: { $sum: 1 },
        revenue: { $sum: '$counselorEarning' },
      },
    },
    { $sort: { _id: 1 } },
    { $project: { date: '$_id', count: 1, revenue: 1, _id: 0 } },
  ]);

  res.json(new ApiResponse(HTTP_STATUS.OK, { trends }));
});
