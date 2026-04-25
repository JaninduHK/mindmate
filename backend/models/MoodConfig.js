import mongoose from 'mongoose';

export const MOOD_TYPES = ['Positive', 'Stable', 'Pressure', 'Low'];

export const DEFAULT_MOOD_CONFIG = {
  Positive: { emoji: '😊', keywords: ['Calm'] },
  Stable: { emoji: '😐', keywords: ['Busy'] },
  Pressure: { emoji: '😰', keywords: ['Worried'] },
  Low: { emoji: '😔', keywords: ['Tired'] },
};

const moodConfigSchema = new mongoose.Schema(
  {
    moodType: {
      type: String,
      enum: MOOD_TYPES,
      required: true,
      unique: true,
      trim: true,
    },
    emoji: {
      type: String,
      default: '',
      trim: true,
      maxlength: 10,
    },
    keywords: {
      type: [String],
      default: [],
      validate: {
        validator: (arr) => arr.every((x) => String(x || '').trim().length > 0),
        message: 'Keywords cannot include empty values',
      },
    },
  },
  { timestamps: true }
);

export default mongoose.model('MoodConfig', moodConfigSchema);
