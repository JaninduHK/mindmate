import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import MoodConfig, { DEFAULT_MOOD_CONFIG, MOOD_TYPES } from '../models/MoodConfig.js';
import { HTTP_STATUS } from '../config/constants.js';

const parseKeywords = (raw) => {
  if (Array.isArray(raw)) {
    return raw
      .map((k) => String(k ?? '').trim())
      .filter(Boolean)
      .slice(0, 50);
  }
  if (typeof raw === 'string') {
    return raw
      .split(/[,\n]+/)
      .map((k) => k.trim())
      .filter(Boolean)
      .slice(0, 50);
  }
  return [];
};

const ensureDefaults = async () => {
  await Promise.all(
    MOOD_TYPES.map(async (moodType) => {
      const existing = await MoodConfig.findOne({ moodType }).lean();
      if (existing) return;
      await MoodConfig.create({
        moodType,
        emoji: DEFAULT_MOOD_CONFIG[moodType].emoji,
        keywords: DEFAULT_MOOD_CONFIG[moodType].keywords,
      });
    })
  );
};

export const getMoodConfig = asyncHandler(async (_req, res) => {
  await ensureDefaults();

  const configs = await MoodConfig.find().lean();
  const byMood = {};
  configs.forEach((cfg) => {
    byMood[cfg.moodType] = {
      moodType: cfg.moodType,
      emoji: cfg.emoji || DEFAULT_MOOD_CONFIG[cfg.moodType].emoji,
      keywords: Array.isArray(cfg.keywords) ? cfg.keywords : DEFAULT_MOOD_CONFIG[cfg.moodType].keywords,
      defaultKeywords: DEFAULT_MOOD_CONFIG[cfg.moodType].keywords,
    };
  });

  const ordered = MOOD_TYPES.map((moodType) => {
    if (byMood[moodType]) return byMood[moodType];
    return {
      moodType,
      emoji: DEFAULT_MOOD_CONFIG[moodType].emoji,
      keywords: DEFAULT_MOOD_CONFIG[moodType].keywords,
      defaultKeywords: DEFAULT_MOOD_CONFIG[moodType].keywords,
    };
  });

  res
    .status(HTTP_STATUS.OK)
    .json(new ApiResponse(HTTP_STATUS.OK, { configs: ordered }, 'Mood config retrieved'));
});

export const patchMoodConfig = asyncHandler(async (req, res) => {
  const { moodType, emoji, keyword, keywords } = req.body;

  if (!MOOD_TYPES.includes(moodType)) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Invalid moodType');
  }

  await ensureDefaults();
  const existing = await MoodConfig.findOne({ moodType });
  const baseKeywords = existing?.keywords?.length
    ? existing.keywords
    : DEFAULT_MOOD_CONFIG[moodType].keywords;

  const incoming = [
    ...(keyword ? [String(keyword).trim()] : []),
    ...parseKeywords(keywords),
  ].filter(Boolean);
  const nextKeywords = [...new Set([...baseKeywords, ...incoming])];

  const nextEmoji = emoji !== undefined && emoji !== null && String(emoji).trim()
    ? String(emoji).trim().slice(0, 10)
    : (existing?.emoji || DEFAULT_MOOD_CONFIG[moodType].emoji);

  const updated = await MoodConfig.findOneAndUpdate(
    { moodType },
    { emoji: nextEmoji, keywords: nextKeywords },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).lean();

  res
    .status(HTTP_STATUS.OK)
    .json(new ApiResponse(HTTP_STATUS.OK, { config: updated }, 'Mood config updated'));
});
