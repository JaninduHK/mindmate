import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import ApiError from '../utils/ApiError.js';
import Mood from '../models/Mood.js';
import Goal from '../models/Goal.js';
import { HTTP_STATUS } from '../config/constants.js';

const parseISODateOnly = (s) => {
  if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const [y, m, d] = s.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (Number.isNaN(dt.getTime())) return null;
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) return null;
  return dt;
};

const getTodayUTCDateOnly = () => {
  const t = new Date();
  return new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), t.getUTCDate()));
};

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

/** Validates report date range and checks mood/goal rows in range (for PDF / download gating). */
export const checkReportRange = asyncHandler(async (req, res) => {
  const { startDate: startStr, endDate: endStr } = req.query;

  if (!startStr || !endStr) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Start date and end date are required');
  }//Required Fields Check

  const start = parseISODateOnly(startStr);
  const end = parseISODateOnly(endStr);
  if (!start || !end) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Invalid date format');
  } //End Date stops so that it cannot be set one day earlier than the Start Date.//

  if (start > end) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Start date must be before or equal to end date');
  } //Future Date Validation

  const today = getTodayUTCDateOnly();
  if (start > today || end > today) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Dates cannot be in the future');
  }

  const userId = req.user._id;

  const [moodCount, goalCount] = await Promise.all([
    Mood.countDocuments({ userId, date: { $gte: start, $lte: end } }),
    Goal.countDocuments({ userId, date: { $gte: start, $lte: end } }),
  ]);

  const hasData = moodCount > 0 || goalCount > 0;

  res.json(
    new ApiResponse(
      HTTP_STATUS.OK,
      { hasData, moodCount, goalCount },
      hasData ? 'Data available for selected period' : 'No data for selected period'
    )
  );
});

