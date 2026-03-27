import mongoose from 'mongoose';

const goalSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    goalName: {
      type: String,
      required: true,
      trim: true,
    },
    goalType: {
      type: String,
      required: true,
      enum: ['daily', 'weekly', 'custom'],
    },
    frequencyPerWeek: {
      type: Number,
      required: true,
      default: 1,
      min: 1,
      max: 7,
    },
    completedSessions: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      required: true,
      enum: ['complete', 'incomplete'],
      default: 'incomplete',
    },
    date: {
      // Store normalized UTC "date only" (midnight UTC)
      type: Date,
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

// Helpful indexes for duplicate prevention
goalSchema.index({ userId: 1, goalType: 1, goalName: 1, date: 1 });

const Goal = mongoose.model('Goal', goalSchema);

export default Goal;

