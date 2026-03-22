import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import Booking from '../models/Booking.model.js';
import Event from '../models/Event.model.js';
import CounselorProfile from '../models/CounselorProfile.model.js';
import User from '../models/User.model.js';
import PlatformConfig from '../models/PlatformConfig.model.js';
import { getStripe } from '../config/stripe.js';
import { sendNotification } from '../services/notification.service.js';
import { HTTP_STATUS } from '../config/constants.js';

// GET /api/payments/bank-details  (public)
export const getBankDetails = asyncHandler(async (req, res) => {
  const config = await PlatformConfig.getConfig();
  res.json(new ApiResponse(HTTP_STATUS.OK, { bankDetails: config.bankDetails }));
});

// POST /api/payments/webhook  (raw body — bypass express.json)
export const stripeWebhook = async (req, res) => {
  const stripe = getStripe();
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'payment_intent.succeeded') {
    const pi = event.data.object;
    const booking = await Booking.findOne({ paymentIntentId: pi.id });
    if (!booking) return res.json({ received: true });

    booking.status = 'confirmed';
    booking.paymentStatus = 'paid';
    await booking.save();

    // Decrement seats
    await Event.findByIdAndUpdate(booking.eventId, { $inc: { seatsAvailable: -1 } });

    // Notify user
    const eventDoc = await Event.findById(booking.eventId);
    await sendNotification({
      userId: booking.userId,
      type: 'booking_confirmed',
      title: 'Booking Confirmed',
      message: `Your booking for "${eventDoc?.title}" is confirmed!`,
      data: { bookingId: booking._id, eventId: booking.eventId },
    });

    // Notify counselor
    await sendNotification({
      userId: booking.counselorId,
      type: 'payment_received',
      title: 'New Booking',
      message: `You have a new booking for "${eventDoc?.title}".`,
      data: { bookingId: booking._id, eventId: booking.eventId },
    });

    // Transfer to counselor if Stripe Connect is set up
    const counselorProfile = await CounselorProfile.findOne({ userId: booking.counselorId });
    if (counselorProfile?.stripeAccountId) {
      try {
        await stripe.transfers.create({
          amount: Math.round(booking.counselorEarning * 100),
          currency: 'usd',
          destination: counselorProfile.stripeAccountId,
          transfer_group: booking._id.toString(),
        });
      } catch (transferErr) {
        console.error('Stripe transfer error:', transferErr.message);
      }
    }
  }

  res.json({ received: true });
};

// GET /api/payments/connect/onboard
export const getConnectOnboardingUrl = asyncHandler(async (req, res) => {
  const stripe = getStripe();

  let counselorProfile = await CounselorProfile.findOne({ userId: req.user._id });
  if (!counselorProfile) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Counselor profile not found');
  }

  let accountId = counselorProfile.stripeAccountId;
  if (!accountId) {
    const account = await stripe.accounts.create({ type: 'express' });
    accountId = account.id;
    counselorProfile.stripeAccountId = accountId;
    await counselorProfile.save();
  }

  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${process.env.CLIENT_URL}/counselor/dashboard`,
    return_url: `${process.env.CLIENT_URL}/counselor/dashboard?stripe=success`,
    type: 'account_onboarding',
  });

  res.json(new ApiResponse(HTTP_STATUS.OK, { url: accountLink.url }));
});

// GET /api/payments/connect/status
export const getConnectStatus = asyncHandler(async (req, res) => {
  const counselorProfile = await CounselorProfile.findOne({ userId: req.user._id });
  if (!counselorProfile?.stripeAccountId) {
    return res.json(new ApiResponse(HTTP_STATUS.OK, { connected: false }));
  }

  const stripe = getStripe();
  const account = await stripe.accounts.retrieve(counselorProfile.stripeAccountId);
  res.json(
    new ApiResponse(HTTP_STATUS.OK, {
      connected: account.charges_enabled && account.payouts_enabled,
      accountId: counselorProfile.stripeAccountId,
    })
  );
});
