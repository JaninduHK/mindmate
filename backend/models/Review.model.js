import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
    },
    counselorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5'],
    },
    comment: {
      type: String,
      trim: true,
      maxlength: [1000, 'Review cannot exceed 1000 characters'],
    },
    isVerified: {
      type: Boolean,
      default: true, // True means booking was confirmed
    },
  },
  { timestamps: true }
);

// One review per user per event
reviewSchema.index({ userId: 1, eventId: 1 }, { unique: true });
reviewSchema.index({ eventId: 1 });
reviewSchema.index({ counselorId: 1 });

const Review = mongoose.model('Review', reviewSchema);

export default Review;
