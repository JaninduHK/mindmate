import mongoose from 'mongoose';
import Availability from '../models/Availability.model.js';
import User from '../models/User.model.js';
import PeerSupporterProfile from '../models/PeerSupporterProfile.model.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import  asyncHandler from '../utils/asyncHandler.js';
import { USER_ROLES } from '../config/constants.js';

/**
 * Add a new availability slot for a peer counselor
 * @route POST /api/availability
 * @access Private (peer_supporter only)
 */
export const addAvailability = asyncHandler(async (req, res) => {
  const { date, startTime, endTime, maxCapacity, description, isRecurring, recurringDays, recurringEndDate } =
    req.body;
  const userId = req.user._id;

  // Validate user is a peer supporter
  const user = await User.findById(userId);
  if (!user || user.role !== USER_ROLES.PEER_SUPPORTER) {
    throw new ApiError(403, 'Only peer supporters can add availability');
  }

  // Verify peer supporter profile exists and is verified
  const peerProfile = await PeerSupporterProfile.findOne({ userId });
  if (!peerProfile || !peerProfile.isVerified) {
    throw new ApiError(403, 'Your peer supporter profile must be verified to add availability');
  }

  // Validate required fields
  if (!date || !startTime || !endTime) {
    throw new ApiError(400, 'Date, start time, and end time are required');
  }

  // Validate date format
  const availabilityDate = new Date(date);
  if (isNaN(availabilityDate.getTime())) {
    throw new ApiError(400, 'Invalid date format');
  }

  // Check if slot already exists for this time
  const existingSlot = await Availability.findOne({
    userId,
    date: {
      $gte: new Date(availabilityDate.setHours(0, 0, 0, 0)),
      $lt: new Date(availabilityDate.setHours(23, 59, 59, 999)),
    },
    startTime,
    endTime,
  });

  if (existingSlot) {
    throw new ApiError(409, 'This time slot already exists');
  }

  const availability = new Availability({
    userId,
    date: new Date(date),
    startTime,
    endTime,
    maxCapacity: maxCapacity || 1,
    description: description || '',
    isRecurring: isRecurring || false,
    recurringDays: recurringDays || [],
    recurringEndDate: recurringEndDate ? new Date(recurringEndDate) : null,
  });

  await availability.save();

  return res
    .status(201)
    .json(new ApiResponse(201, availability, 'Availability slot created successfully'));
});

/**
 * Get all availability slots for the logged-in peer counselor
 * @route GET /api/availability/my-slots
 * @access Private (peer_supporter only)
 */
export const getMyAvailability = asyncHandler(async (req, res) => {
  const { startDate, endDate, isBooked } = req.query;
  const userId = req.user._id;

  // Validate user is a peer supporter
  const user = await User.findById(userId);
  if (!user || user.role !== USER_ROLES.PEER_SUPPORTER) {
    throw new ApiError(403, 'Only peer supporters can view their availability');
  }

  let filter = { userId };

  // Apply date range filter if provided
  if (startDate && endDate) {
    filter.date = {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    };
  }

  // Apply booking status filter if provided
  if (isBooked !== undefined) {
    filter.isBooked = isBooked === 'true';
  }

  const availability = await Availability.find(filter).sort({ date: 1, startTime: 1 });

  return res
    .status(200)
    .json(new ApiResponse(200, availability, 'Availability slots retrieved successfully'));
});

/**
 * Get available slots for a specific peer counselor (for users to book)
 * @route GET /api/availability/counselor/:counselorId
 * @access Public
 */
export const getAvailabilityByCounselor = asyncHandler(async (req, res) => {
  const { counselorId } = req.params;
  const { startDate, endDate } = req.query;

  // Verify counselor exists and is a peer supporter
  const user = await User.findById(counselorId);
  if (!user || user.role !== USER_ROLES.PEER_SUPPORTER) {
    throw new ApiError(404, 'Peer supporter not found');
  }

  const peerProfile = await PeerSupporterProfile.findOne({ userId: counselorId });
  if (!peerProfile || !peerProfile.isVerified) {
    throw new ApiError(403, 'This peer supporter is not available for booking');
  }

  let filter = { userId: counselorId, isBooked: false };

  // Only show future slots
  filter.date = { $gte: new Date() };

  if (startDate && endDate) {
    filter.date = {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    };
  }

  const availability = await Availability.find(filter)
    .select('-isRecurring -recurringDays -recurringEndDate')
    .sort({ date: 1, startTime: 1 });

  return res
    .status(200)
    .json(new ApiResponse(200, availability, 'Available slots retrieved successfully'));
});

/**
 * Update an availability slot
 * @route PUT /api/availability/:availabilityId
 * @access Private (peer_supporter owner only)
 */
export const updateAvailability = asyncHandler(async (req, res) => {
  const { availabilityId } = req.params;
  const { date, startTime, endTime, maxCapacity, description } = req.body;
  const userId = req.user._id;

  // Find availability slot
  const availability = await Availability.findById(availabilityId);
  if (!availability) {
    throw new ApiError(404, 'Availability slot not found');
  }

  // Verify ownership
  if (availability.userId.toString() !== userId.toString()) {
    throw new ApiError(403, 'You can only edit your own availability slots');
  }

  // Prevent editing booked slots
  if (availability.isBooked && availability.currentBookings > 0) {
    throw new ApiError(400, 'Cannot edit a booked availability slot');
  }

  // Update fields
  if (date) availability.date = new Date(date);
  if (startTime) availability.startTime = startTime;
  if (endTime) availability.endTime = endTime;
  if (maxCapacity) availability.maxCapacity = maxCapacity;
  if (description !== undefined) availability.description = description;

  await availability.save();

  return res.status(200).json(new ApiResponse(200, availability, 'Availability updated successfully'));
});

/**
 * Delete an availability slot
 * @route DELETE /api/availability/:availabilityId
 * @access Private (peer_supporter owner only)
 */
export const deleteAvailability = asyncHandler(async (req, res) => {
  const { availabilityId } = req.params;
  const userId = req.user._id;

  // Find availability slot
  const availability = await Availability.findById(availabilityId);
  if (!availability) {
    throw new ApiError(404, 'Availability slot not found');
  }

  // Verify ownership
  if (availability.userId.toString() !== userId.toString()) {
    throw new ApiError(403, 'You can only delete your own availability slots');
  }

  // Prevent deleting booked slots with active bookings
  if (availability.currentBookings > 0) {
    throw new ApiError(400, 'Cannot delete a slot that has active bookings');
  }

  await Availability.findByIdAndDelete(availabilityId);

  return res.status(200).json(new ApiResponse(200, null, 'Availability slot deleted successfully'));
});

/**
 * Get all available peer counselors (for user browsing)
 * @route GET /api/availability/available-counselors
 * @access Public
 */
export const getAvailableCounselors = asyncHandler(async (req, res) => {
  const { date, startTime, endTime, limit = 10, skip = 0 } = req.query;

  let filter = {};

  // Filter by specific date and time if provided
  if (date && startTime && endTime) {
    const availabilityDate = new Date(date);
    filter.date = {
      $gte: new Date(availabilityDate.setHours(0, 0, 0, 0)),
      $lt: new Date(availabilityDate.setHours(23, 59, 59, 999)),
    };
    filter.startTime = startTime;
    filter.endTime = endTime;
    filter.isBooked = false;
  } else {
    // Show all available slots in the future
    filter.date = { $gte: new Date() };
    filter.isBooked = false;
  }

  const availableSlots = await Availability.find(filter)
    .populate({
      path: 'userId',
      select: 'name avatar',
      match: { role: USER_ROLES.PEER_SUPPORTER },
    })
    .skip(parseInt(skip))
    .limit(parseInt(limit))
    .sort({ date: 1, startTime: 1 });

  const total = await Availability.countDocuments(filter);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        slots: availableSlots,
        total,
        limit: parseInt(limit),
        skip: parseInt(skip),
      },
      'Available counselors retrieved successfully'
    )
  );
});

/**
 * Check availability for a specific time slot
 * @route POST /api/availability/check
 * @access Public
 */
export const checkAvailability = asyncHandler(async (req, res) => {
  const { counselorId, date, startTime, endTime } = req.body;

  if (!counselorId || !date || !startTime || !endTime) {
    throw new ApiError(400, 'Counselor ID, date, start time, and end time are required');
  }

  const availabilityDate = new Date(date);
  const slot = await Availability.findOne({
    userId: counselorId,
    date: {
      $gte: new Date(availabilityDate.setHours(0, 0, 0, 0)),
      $lt: new Date(availabilityDate.setHours(23, 59, 59, 999)),
    },
    startTime,
    endTime,
  });

  const isAvailable = slot && !slot.isBooked && slot.currentBookings < slot.maxCapacity;

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        isAvailable,
        slot: slot || null,
      },
      'Availability checked successfully'
    )
  );
});

/**
 * Get availability statistics for a peer counselor
 * @route GET /api/availability/stats
 * @access Private (peer_supporter only)
 */
export const getAvailabilityStats = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // Validate user is a peer supporter
  const user = await User.findById(userId);
  if (!user || user.role !== USER_ROLES.PEER_SUPPORTER) {
    throw new ApiError(403, 'Only peer supporters can view availability stats');
  }

  const stats = await Availability.aggregate([
    { $match: { userId: mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: null,
        totalSlots: { $sum: 1 },
        bookedSlots: {
          $sum: { $cond: [{ $eq: ['$isBooked', true] }, 1, 0] },
        },
        availableSlots: {
          $sum: { $cond: [{ $eq: ['$isBooked', false] }, 1, 0] },
        },
        totalBookings: { $sum: '$currentBookings' },
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        stats[0] || { totalSlots: 0, bookedSlots: 0, availableSlots: 0, totalBookings: 0 },
        'Availability statistics retrieved successfully'
      )
    );
});
