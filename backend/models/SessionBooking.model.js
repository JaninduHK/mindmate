import mongoose from 'mongoose';

const sessionBookingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    supporterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    topic: {
      type: String,
      required: true,
    },
    notes: {
      type: String,
      default: '',
    },
    sessionDate: {
      type: Date,
      required: true,
    },
    sessionTime: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'completed', 'cancelled'],
      default: 'pending',
    },
    meetingLink: {
      type: String,
      default: null,
    },
    feedback: {
      rating: {
        type: Number,
        min: 1,
        max: 5,
        default: null,
      },
      comment: {
        type: String,
        default: null,
      },
    },
  },
  { timestamps: true }
);

// Index for quick lookups
sessionBookingSchema.index({ userId: 1, supporterId: 1 });
sessionBookingSchema.index({ sessionDate: 1 });

const SessionBooking = mongoose.model('SessionBooking', sessionBookingSchema);
export default SessionBooking;
