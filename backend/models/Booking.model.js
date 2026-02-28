import mongoose from 'mongoose';
import { BOOKING_STATUSES, PAYMENT_STATUSES } from '../config/constants.js';

const bookingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
      index: true,
    },
    counselorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: BOOKING_STATUSES,
      default: 'pending',
    },
    paymentIntentId: {
      type: String,
      sparse: true,
    },
    paymentStatus: {
      type: String,
      enum: PAYMENT_STATUSES,
      default: 'pending',
    },
    amountPaid: {
      type: Number,
      default: 0,
    },
    platformFee: {
      type: Number,
      default: 0,
    },
    counselorEarning: {
      type: Number,
      default: 0,
    },
    // Real identity provided at booking (separate from anonymous username shown in public UI)
    attendee: {
      name: { type: String, default: '' },
      email: { type: String, default: '' },
      phone: { type: String, default: '' },
    },
    healthData: {
      conditions: {
        type: String, // AES-256-GCM encrypted
        default: '',
      },
      medications: {
        type: String, // AES-256-GCM encrypted
        default: '',
      },
      consentGiven: {
        type: Boolean,
        required: [true, 'Consent is required to proceed'],
      },
      consentDate: {
        type: Date,
        default: Date.now,
      },
    },
    cancellationReason: {
      type: String,
      default: '',
    },
    refundedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

const Booking = mongoose.model('Booking', bookingSchema);

export default Booking;
