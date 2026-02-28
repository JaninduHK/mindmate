import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import Review from '../models/Review.model.js';
import Booking from '../models/Booking.model.js';
import Event from '../models/Event.model.js';
import CounselorProfile from '../models/CounselorProfile.model.js';
import { HTTP_STATUS } from '../config/constants.js';

// Recompute and save rating averages after every review mutation
const recalculateRatings = async (eventId, counselorId) => {
  const stats = await Review.aggregate([
    { $match: { eventId: eventId } },
    { $group: { _id: null, avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);

  const { avgRating = 0, count = 0 } = stats[0] || {};
  await Event.findByIdAndUpdate(eventId, { rating: Math.round(avgRating * 10) / 10, reviewCount: count });

  const counselorStats = await Review.aggregate([
    { $match: { counselorId: counselorId } },
    { $group: { _id: null, avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);

  const { avgRating: cAvg = 0, count: cCount = 0 } = counselorStats[0] || {};
  await CounselorProfile.findOneAndUpdate(
    { userId: counselorId },
    { rating: Math.round(cAvg * 10) / 10, reviewCount: cCount }
  );
};

// POST /api/reviews
export const createReview = asyncHandler(async (req, res) => {
  const { eventId, rating, comment } = req.body;

  // Must have a confirmed or completed paid booking
  const booking = await Booking.findOne({
    userId: req.user._id,
    eventId,
    status: { $in: ['confirmed', 'completed'] },
    paymentStatus: 'paid',
  });
  if (!booking) {
    throw new ApiError(HTTP_STATUS.FORBIDDEN, 'You must have a confirmed booking to leave a review');
  }

  const event = await Event.findById(eventId);
  if (!event) throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Event not found');

  const review = await Review.create({
    userId: req.user._id,
    eventId,
    counselorId: event.counselorId,
    bookingId: booking._id,
    rating,
    comment,
    isVerified: true,
  });

  await recalculateRatings(event._id, event.counselorId);

  res
    .status(HTTP_STATUS.CREATED)
    .json(new ApiResponse(HTTP_STATUS.CREATED, { review }, 'Review submitted'));
});

// GET /api/reviews/event/:eventId
export const getEventReviews = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const [reviews, total] = await Promise.all([
    Review.find({ eventId: req.params.eventId })
      .populate('userId', 'name avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Review.countDocuments({ eventId: req.params.eventId }),
  ]);

  res.json(
    new ApiResponse(HTTP_STATUS.OK, { reviews, total, page, pages: Math.ceil(total / limit) })
  );
});

// GET /api/reviews/counselor/:counselorId
export const getCounselorReviews = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const [reviews, total] = await Promise.all([
    Review.find({ counselorId: req.params.counselorId })
      .populate('userId', 'name avatar')
      .populate('eventId', 'title')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Review.countDocuments({ counselorId: req.params.counselorId }),
  ]);

  res.json(
    new ApiResponse(HTTP_STATUS.OK, { reviews, total, page, pages: Math.ceil(total / limit) })
  );
});

// DELETE /api/reviews/:id
export const deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Review not found');

  const isOwner = String(review.userId) === String(req.user._id);
  if (!isOwner && req.user.role !== 'admin') {
    throw new ApiError(HTTP_STATUS.FORBIDDEN, 'Not authorized to delete this review');
  }

  const { eventId, counselorId } = review;
  await Review.findByIdAndDelete(req.params.id);
  await recalculateRatings(eventId, counselorId);

  res.json(new ApiResponse(HTTP_STATUS.OK, {}, 'Review deleted'));
});
