import PeerSession from '../models/PeerSession.model.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import { HTTP_STATUS } from '../config/constants.js';

export const createSession = asyncHandler(async (req, res) => {
  const { userId, peerId, date, time, topic } = req.body;
  if (!userId || !peerId || !date || !time || !topic) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'userId, peerId, date, time, and topic are required');
  }
  const session = await PeerSession.create({ userId, peerId, date, time, topic });
  const populated = await session.populate('peerId', 'name avatar email');
  res.status(HTTP_STATUS.CREATED).json(new ApiResponse(HTTP_STATUS.CREATED, populated, 'Session booked'));
});

export const getMySessions = asyncHandler(async (req, res) => {
  const { userId, status } = req.query;
  if (!userId) throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'userId is required');

  const filter = { userId };
  if (status) filter.status = status;

  const sessions = await PeerSession.find(filter)
    .populate('peerId', 'name avatar email')
    .sort({ date: -1, createdAt: -1 });

  const counts = await PeerSession.aggregate([
    { $match: { userId: new (await import('mongoose')).default.Types.ObjectId(userId) } },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);

  const statusCounts = { pending: 0, confirmed: 0, completed: 0, cancelled: 0 };
  counts.forEach(({ _id, count }) => { if (statusCounts[_id] !== undefined) statusCounts[_id] = count; });

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, { sessions, statusCounts }, 'Sessions retrieved')
  );
});

export const getPeerIncomingSessions = asyncHandler(async (req, res) => {
  const { peerId, status } = req.query;
  if (!peerId) throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'peerId is required');

  const filter = { peerId };
  if (status) filter.status = status;

  const sessions = await PeerSession.find(filter)
    .populate('userId', 'name avatar email')
    .sort({ date: 1, createdAt: -1 });

  res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, { sessions }, 'Sessions retrieved'));
});

export const updateSessionStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, cancellationReason } = req.body;

  const session = await PeerSession.findById(id);
  if (!session) throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Session not found');

  session.status = status;
  if (cancellationReason) session.cancellationReason = cancellationReason;
  await session.save();

  res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, session, 'Session updated'));
});
