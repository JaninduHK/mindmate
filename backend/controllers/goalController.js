import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import Goal from '../models/Goal.js';
import { HTTP_STATUS } from '../config/constants.js';

const toUTCDateOnly = (input) => {
  if (!input) return null;

  const d = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(d.getTime())) return null;

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

const getUTCISOWeekRange = (dateOnly) => {
  // dateOnly must already be normalized to midnight UTC
  const d = new Date(dateOnly);
  const day = d.getUTCDay(); // 0 (Sun) - 6 (Sat)
  const isoDay = day === 0 ? 7 : day; // 1 (Mon) - 7 (Sun)
  const monday = new Date(d);
  monday.setUTCDate(monday.getUTCDate() - (isoDay - 1));
  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);
  return { start: monday, end: sunday };
};

const frequencyFromGoalType = (goalType) => {
  if (goalType === 'custom') return 3;
  if (goalType === 'weekly') return 1;
  return 1; // daily
};

export const addGoal = asyncHandler(async (req, res) => {
  const { goalName, goalType, status = 'incomplete', date } = req.body;
  const dateOnly = parseDateParamOrBody({ bodyDate: date });
  if (!dateOnly) throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Invalid date');

  const userId = req.user.id;

  const normalizedGoalName = String(goalName ?? '').trim();

  // Duplicate rules:
  // - daily: same goalName once per day
  // - weekly/custom: same goalName once per ISO week
  let duplicateQuery = { userId, goalType, goalName: normalizedGoalName };
  if (goalType === 'daily') {
    duplicateQuery.date = dateOnly;
  } else if (goalType === 'weekly' || goalType === 'custom') {
    const { start, end } = getUTCISOWeekRange(dateOnly);
    duplicateQuery.date = { $gte: start, $lte: end };
  }

  const duplicate = await Goal.findOne(duplicateQuery).lean();
  if (duplicate) throw new ApiError(HTTP_STATUS.CONFLICT, 'Goal already exists for the selected frequency');

  const goal = await Goal.create({
    userId,
    goalName: normalizedGoalName,
    goalType,
    frequencyPerWeek: frequencyFromGoalType(goalType),
    completedSessions: status === 'complete' ? frequencyFromGoalType(goalType) : 0,
    status,
    date: dateOnly,
  });

  const response = goal.toObject();
  response.date = formatDateOnly(response.date);
  delete response.userId;

  res
    .status(HTTP_STATUS.CREATED)
    .json(new ApiResponse(HTTP_STATUS.CREATED, { goal: response }, 'Goal added'));
});

export const getGoals = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const goals = await Goal.find({ userId })
    .select('-userId')
    .sort({ date: -1, createdAt: -1 })
    .lean();

  const formatted = goals.map((g) => ({ ...g, date: formatDateOnly(g.date) }));

  res.json(new ApiResponse(HTTP_STATUS.OK, { goals: formatted }, 'Goals retrieved'));
});

export const updateGoalStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const { id } = req.params;

  const userId = req.user.id;

  const goal = await Goal.findOne({ _id: id, userId });
  if (!goal) throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Goal not found');

  // Session-based completion for weekly/custom goals:
  // - Each "complete" action fills one dot/session.
  // - Goal becomes "complete" only when all required sessions are filled.
  if (status === 'complete') {
    const target = goal.frequencyPerWeek || frequencyFromGoalType(goal.goalType);
    const next = Math.min(goal.completedSessions + 1, target);
    goal.completedSessions = next;
    goal.status = next >= target ? 'complete' : 'incomplete';
  } else {
    goal.status = 'incomplete';
    goal.completedSessions = 0;
  }

  await goal.save();

  const response = goal.toObject();
  response.date = formatDateOnly(response.date);
  delete response.userId;

  const target = response.frequencyPerWeek || frequencyFromGoalType(response.goalType);
  const progressMessage = response.status === 'complete'
    ? 'Goal completed'
    : `Progress updated (${response.completedSessions}/${target})`;

  res.json(new ApiResponse(HTTP_STATUS.OK, { goal: response }, progressMessage));
});

// PUT /api/personal-tracking/goals/:id (edit goal name/type)
export const updateGoalDetails = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { goalName, goalType } = req.body;

  const userId = req.user.id;

  const goal = await Goal.findOne({ _id: id, userId });
  if (!goal) throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Goal not found');

  const normalizedGoalName = String(goalName ?? '').trim();
  if (!normalizedGoalName) throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'goalName is required');

  // Duplicate check excluding the current goal document
  let duplicateQuery = { userId, goalType, goalName: normalizedGoalName, _id: { $ne: id } };
  if (goalType === 'daily') {
    duplicateQuery.date = goal.date;
  } else if (goalType === 'weekly' || goalType === 'custom') {
    const { start, end } = getUTCISOWeekRange(goal.date);
    duplicateQuery.date = { $gte: start, $lte: end };
  }

  const duplicate = await Goal.findOne(duplicateQuery).lean();
  if (duplicate) throw new ApiError(HTTP_STATUS.CONFLICT, 'Goal already exists for the selected frequency');

  goal.goalName = normalizedGoalName;
  goal.goalType = goalType;
  goal.frequencyPerWeek = frequencyFromGoalType(goalType);
  goal.completedSessions = Math.min(goal.completedSessions || 0, goal.frequencyPerWeek);
  goal.status = goal.completedSessions >= goal.frequencyPerWeek ? 'complete' : 'incomplete';
  await goal.save();

  const response = goal.toObject();
  response.date = formatDateOnly(response.date);
  delete response.userId;

  res.json(new ApiResponse(HTTP_STATUS.OK, { goal: response }, 'Goal updated'));
});

export const deleteGoal = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const deleted = await Goal.findOneAndDelete({ _id: id, userId }).select('-userId').lean();
  if (!deleted) throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Goal not found');

  deleted.date = formatDateOnly(deleted.date);

  res.json(new ApiResponse(HTTP_STATUS.OK, { goal: deleted }, 'Goal deleted'));
});

