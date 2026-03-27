import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import Mood from '../models/Mood.js';
import { HTTP_STATUS } from '../config/constants.js';

const toUTCDateOnly = (input) => {
  if (!input) return null;

  const d = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(d.getTime())) return null;

  // Normalize to midnight UTC for stable uniqueness per-day
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
};

const formatDateOnly = (d) => {
  if (!d) return null;
  return new Date(d).toISOString().slice(0, 10);
};

const parseDateParamOrBody = ({ paramDate, bodyDate }) => {
  const raw = paramDate ?? bodyDate;
  if (raw === undefined) return toUTCDateOnly(new Date());
  const dateOnly = toUTCDateOnly(raw);
  return dateOnly;
};

export const addMood = asyncHandler(async (req, res) => {
  const { mood, keyword, description, date } = req.body;

  const dateOnly = parseDateParamOrBody({ bodyDate: date });
  if (!dateOnly) throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Invalid date');

  const userId = req.user.id;

  const existing = await Mood.findOne({ userId, date: dateOnly }).lean();
  if (existing) {
    throw new ApiError(HTTP_STATUS.CONFLICT, 'Mood already exists for this date');
  }

  const moodEntry = await Mood.create({
    userId,
    date: dateOnly,
    mood,
    keyword,
    description,
  });

  const response = moodEntry.toObject();
  response.date = formatDateOnly(response.date);
  delete response.userId;

  res.status(HTTP_STATUS.CREATED).json(new ApiResponse(HTTP_STATUS.CREATED, { mood: response }, 'Mood added'));
});

export const getMoodHistory = asyncHandler(async (req, res) => {
  const { from, to } = req.query;
  const userId = req.user.id;

  const filter = { userId };

  const fromDate = from ? toUTCDateOnly(from) : null;
  const toDate = to ? toUTCDateOnly(to) : null;

  if (fromDate) filter.date = { ...(filter.date ?? {}), $gte: fromDate };
  if (toDate) filter.date = { ...(filter.date ?? {}), $lte: toDate };

  const moods = await Mood.find(filter)
    .select('-userId')
    .sort({ date: -1, createdAt: -1 })
    .lean();

  const formatted = moods.map((m) => ({
    ...m,
    date: formatDateOnly(m.date),
  }));

  res.json(new ApiResponse(HTTP_STATUS.OK, { moods: formatted }, 'Mood history retrieved'));
});

export const updateMood = asyncHandler(async (req, res) => {
  const { mood, keyword, description } = req.body;
  const { date } = req.params;

  const dateOnly = parseDateParamOrBody({ paramDate: date });
  if (!dateOnly) throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Invalid date');

  const userId = req.user.id;

  const moodEntry = await Mood.findOne({ userId, date: dateOnly });
  if (!moodEntry) throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Mood entry not found for this date');

  moodEntry.mood = mood;
  moodEntry.keyword = keyword;
  moodEntry.description = description;
  await moodEntry.save();

  const response = moodEntry.toObject();
  response.date = formatDateOnly(response.date);
  delete response.userId;

  res.json(new ApiResponse(HTTP_STATUS.OK, { mood: response }, 'Mood updated'));
});

export const deleteMood = asyncHandler(async (req, res) => {
  const { date } = req.params;
  const dateOnly = parseDateParamOrBody({ paramDate: date });
  if (!dateOnly) throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Invalid date');

  const userId = req.user.id;

  const deleted = await Mood.findOneAndDelete({ userId, date: dateOnly }).select('-userId').lean();
  if (!deleted) throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Mood entry not found for this date');

  deleted.date = formatDateOnly(deleted.date);

  res.json(new ApiResponse(HTTP_STATUS.OK, { mood: deleted }, 'Mood deleted'));
});

