import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import Mood from '../models/Mood.js';
import Goal from '../models/Goal.js';
import { HTTP_STATUS } from '../config/constants.js';

export const getAnalyticsSummary = asyncHandler(async (req, res) => {
  // Use ObjectId for reliable $match in aggregation.
  const userId = req.user._id;

  const today = new Date();
  // Midnight UTC boundary for "today"
  const startOfTodayUTC = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())
  );

  const [mostCommonMoodAgg, stressCount, moodCounts, missingGoalsCount] = await Promise.all([
    Mood.aggregate([
      { $match: { userId } },
      { $group: { _id: '$mood', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 },
    ]),
    Mood.countDocuments({ userId, mood: 'Pressure' }),
    Mood.aggregate([
      { $match: { userId } },
      { $group: { _id: '$mood', count: { $sum: 1 } } },
    ]),
    // Missing = incomplete AND strictly before today (UTC)
    Goal.countDocuments({ userId, status: 'incomplete', date: { $lt: startOfTodayUTC } }),
  ]);

  const mostCommonMood = mostCommonMoodAgg?.[0]?._id ?? null;

  const moodOrder = ['Positive', 'Stable', 'Pressure', 'Low'];
  const totalMoods = (moodCounts ?? []).reduce((sum, r) => sum + (r?.count ?? 0), 0);
  const moodDistribution = moodOrder.map((mood) => {
    const found = (moodCounts ?? []).find((r) => r?._id === mood);
    const count = found?.count ?? 0;
    const percent = totalMoods > 0 ? (count / totalMoods) * 100 : 0; // one decimal
    return { mood, count, percent };
  });

  res.json(
    new ApiResponse(
      HTTP_STATUS.OK,
      {
        mostCommonMood,
        stressCount,
        missingGoalsCount,
        moodDistribution,
      },
      'Analytics summary retrieved'
    )
  );
});

