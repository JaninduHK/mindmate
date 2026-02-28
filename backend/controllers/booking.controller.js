import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import Booking from '../models/Booking.model.js';
import Event from '../models/Event.model.js';
import PlatformConfig from '../models/PlatformConfig.model.js';
import { getStripe } from '../config/stripe.js';
import { encrypt } from '../utils/encryption.util.js';
import { HTTP_STATUS } from '../config/constants.js';

// POST /api/bookings
export const createBooking = asyncHandler(async (req, res) => {
  const { eventId, healthData, attendee } = req.body;

  if (!healthData?.consentGiven) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'You must consent to sharing health information to proceed');
  }
  if (!attendee?.name) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Your real name is required for booking');
  }

  const event = await Event.findById(eventId);
  if (!event) throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Event not found');
  if (event.status !== 'published') {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Event is not available for booking');
  }
  if (event.seatsAvailable < 1) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'No seats available');
  }

  // Prevent duplicate bookings
  const existing = await Booking.findOne({
    userId: req.user._id,
    eventId,
    status: { $in: ['pending', 'confirmed'] },
  });
  if (existing) throw new ApiError(HTTP_STATUS.CONFLICT, 'You already have a booking for this event');

  const config = await PlatformConfig.getConfig();
  const amountInCents = Math.round(event.price * 100);
  const platformFeeInCents = Math.round(amountInCents * (config.commissionRate / 100));
  const counselorEarningInCents = amountInCents - platformFeeInCents;

  // Encrypt sensitive health data
  const encryptedConditions = healthData.conditions ? encrypt(healthData.conditions) : '';
  const encryptedMedications = healthData.medications ? encrypt(healthData.medications) : '';

  // Create pending booking with full attendee + health details
  const booking = await Booking.create({
    userId: req.user._id,
    eventId,
    counselorId: event.counselorId,
    amountPaid: event.price,
    platformFee: platformFeeInCents / 100,
    counselorEarning: counselorEarningInCents / 100,
    attendee: {
      name: attendee.name,
      email: attendee.email || req.user.email,
      phone: attendee.phone || '',
    },
    healthData: {
      conditions: encryptedConditions,
      medications: encryptedMedications,
      consentGiven: true,
      consentDate: new Date(),
    },
  });

  // Create Stripe PaymentIntent
  const stripe = getStripe();
  const paymentIntent = await stripe.paymentIntents.create({
    amount: amountInCents,
    currency: 'lkr',
    metadata: {
      bookingId: booking._id.toString(),
      eventId: eventId.toString(),
      userId: req.user._id.toString(),
    },
  });

  booking.paymentIntentId = paymentIntent.id;
  await booking.save();

  res.status(HTTP_STATUS.CREATED).json(
    new ApiResponse(
      HTTP_STATUS.CREATED,
      { booking, clientSecret: paymentIntent.client_secret },
      'Booking created — complete payment to confirm'
    )
  );
});

// GET /api/bookings/my
export const getMyBookings = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const filter = { userId: req.user._id };
  if (req.query.status) filter.status = req.query.status;
  if (req.query.eventId) filter.eventId = req.query.eventId;

  const [bookings, total] = await Promise.all([
    Booking.find(filter)
      .populate('eventId', 'title startDate coverImage price')
      .populate('counselorId', 'name avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Booking.countDocuments(filter),
  ]);

  res.json(
    new ApiResponse(HTTP_STATUS.OK, { bookings, total, page, pages: Math.ceil(total / limit) })
  );
});

// GET /api/bookings/:id
export const getBookingById = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id)
    .populate('eventId')
    .populate('counselorId', 'name avatar email')
    .populate('userId', 'name email');

  if (!booking) throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Booking not found');

  const isOwner = String(booking.userId._id) === String(req.user._id);
  const isCounselor = String(booking.counselorId._id) === String(req.user._id);
  const isAdmin = req.user.role === 'admin';

  if (!isOwner && !isCounselor && !isAdmin) {
    throw new ApiError(HTTP_STATUS.FORBIDDEN, 'Not authorized to view this booking');
  }

  // Decrypt health data only for authorized parties
  const bookingObj = booking.toObject();
  if (isOwner || isCounselor || isAdmin) {
    const { decrypt } = await import('../utils/encryption.util.js');
    bookingObj.healthData.conditions = decrypt(booking.healthData.conditions);
    bookingObj.healthData.medications = decrypt(booking.healthData.medications);
  }

  res.json(new ApiResponse(HTTP_STATUS.OK, { booking: bookingObj }));
});

// POST /api/bookings/:id/cancel
export const cancelBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Booking not found');

  const isOwner = String(booking.userId) === String(req.user._id);
  const isAdmin = req.user.role === 'admin';
  if (!isOwner && !isAdmin) {
    throw new ApiError(HTTP_STATUS.FORBIDDEN, 'Not authorized to cancel this booking');
  }

  if (!['pending', 'confirmed'].includes(booking.status)) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Booking cannot be cancelled in its current state');
  }

  // Refund via Stripe if payment was made
  if (booking.paymentStatus === 'paid' && booking.paymentIntentId) {
    const stripe = getStripe();
    await stripe.refunds.create({ payment_intent: booking.paymentIntentId });
    booking.paymentStatus = 'refunded';
    booking.refundedAt = new Date();
  }

  booking.status = 'cancelled';
  booking.cancellationReason = req.body.reason || 'Cancelled by user';
  await booking.save();

  // Restore seat
  await Event.findByIdAndUpdate(booking.eventId, { $inc: { seatsAvailable: 1 } });

  res.json(new ApiResponse(HTTP_STATUS.OK, { booking }, 'Booking cancelled'));
});
