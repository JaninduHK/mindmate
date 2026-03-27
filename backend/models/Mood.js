import mongoose from 'mongoose';

const moodSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    date: {
      // Store as a normalized UTC "date only" (midnight UTC)
      type: Date,
      required: true,
      index: true,
    },
    mood: {
      type: String,
      required: true,
      enum: ['Positive', 'Stable', 'Pressure', 'Low'],
    },
    keyword: {
      type: String,
      required: true,
      enum: ['Busy', 'Calm', 'Tired', 'Worried'],
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true }
);

// One mood entry per user per day
moodSchema.index({ userId: 1, date: 1 }, { unique: true });

const Mood = mongoose.model('Mood', moodSchema);

export default Mood;

