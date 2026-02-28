import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import Notification from '../models/Notification.model.js';
import { HTTP_STATUS } from '../config/constants.js';

// GET /api/notifications
export const getNotifications = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Notification.countDocuments({ userId: req.user._id }),
    Notification.countDocuments({ userId: req.user._id, isRead: false }),
  ]);

  res.json(
    new ApiResponse(HTTP_STATUS.OK, {
      notifications,
      total,
      unreadCount,
      page,
      pages: Math.ceil(total / limit),
    })
  );
});

// PUT /api/notifications/:id/read
export const markAsRead = asyncHandler(async (req, res) => {
  await Notification.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id },
    { isRead: true }
  );
  res.json(new ApiResponse(HTTP_STATUS.OK, {}, 'Notification marked as read'));
});

// PUT /api/notifications/read-all
export const markAllAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ userId: req.user._id, isRead: false }, { isRead: true });
  res.json(new ApiResponse(HTTP_STATUS.OK, {}, 'All notifications marked as read'));
});
