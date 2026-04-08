import mongoose from 'mongoose';
import Availability from '../models/Availability.model.js';
import User from '../models/User.model.js';
import PeerSupporterProfile from '../models/PeerSupporterProfile.model.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import { USER_ROLES } from '../config/constants.js';

/**
 * Add a new availability slot for a peer counselor
 * @route POST /api/availability
 * @access Private (peer_supporter only)
 */
export const addAvailability = asyncHandler(async (req, res) => {
  const { date, startTime, endTime, slotDuration, notes } = req.body;
  const supporterId = req.user._id;

  console.log('Adding availability - supporterId:', supporterId, 'date:', date, 'startTime:', startTime, 'endTime:', endTime);

  // Validate user is a peer supporter
  const user = await User.findById(supporterId);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }
  if (user.role !== USER_ROLES.PEER_SUPPORTER) {
    throw new ApiError(403, 'Only peer supporters can add availability');
  }

  // Verify peer supporter profile exists, create if not
  let peerProfile = await PeerSupporterProfile.findOne({ userId: supporterId });
  if (!peerProfile) {
    // Auto-create peer supporter profile if it doesn't exist
    peerProfile = await PeerSupporterProfile.create({
      userId: supporterId,
      isVerified: false,
    });
    console.log('Created peer supporter profile for user:', supporterId);
  }

  // Validate required fields
  if (!date || !startTime || !endTime) {
    throw new ApiError(400, 'Date, start time, and end time are required');
  }

  // Validate time formats (HH:MM)
  const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
  if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
    throw new ApiError(400, 'Invalid time format. Use HH:MM format (24-hour)');
  }

  // Validate date format and convert to consistent format (YYYY-MM-DD)
  // Parse as string to avoid timezone issues
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) {
    throw new ApiError(400, 'Date must be in YYYY-MM-DD format');
  }

  // Create date object from the string in UTC to avoid timezone shifting
  const [year, month, day] = date.split('-').map(Number);
  const availabilityDate = new Date(Date.UTC(year, month - 1, day));

  // Check if slot already exists for this date and time
  const dateStart = new Date(Date.UTC(year, month - 1, day));
  const dateEnd = new Date(Date.UTC(year, month - 1, day + 1));
  
  const existingSlot = await Availability.findOne({
    supporterId,
    date: {
      $gte: dateStart,
      $lt: dateEnd,
    },
    startTime,
    endTime,
  });

  if (existingSlot) {
    throw new ApiError(409, 'This time slot already exists for this date');
  }

  const availability = new Availability({
    supporterId,
    date: availabilityDate,
    startTime,
    endTime,
    slotDuration: slotDuration || 60,
    notes: notes || '',
    isActive: true,
  });

  await availability.save();

  console.log('Availability created:', availability);

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
  const { startDate, endDate } = req.query;
  const supporterId = req.user._id;

  // Validate user is a peer supporter
  const user = await User.findById(supporterId);
  if (!user || user.role !== USER_ROLES.PEER_SUPPORTER) {
    throw new ApiError(403, 'Only peer supporters can view their availability');
  }

  let filter = { supporterId };

  // Apply date range filter if provided
  if (startDate && endDate) {
    filter.date = {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    };
  } else {
    // Default: show next 90 days
    const today = new Date();
    const ninetyDaysLater = new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000);
    filter.date = {
      $gte: today,
      $lte: ninetyDaysLater,
    };
  }

  const availability = await Availability.find(filter).sort({ date: 1, startTime: 1 });

  return res
    .status(200)
    .json(new ApiResponse(200, availability, 'Availability slots retrieved successfully'));
});

/**
 * Get available slots for a specific peer counselor (for users to book)
 * @route GET /api/availability/counselor/:supporterId
 * @access Public
 */
export const getAvailabilityByCounselor = asyncHandler(async (req, res) => {
  const { supporterId } = req.params;
  const { startDate, endDate } = req.query;

  // Verify counselor exists and is a peer supporter
  const user = await User.findById(supporterId);
  if (!user || user.role !== USER_ROLES.PEER_SUPPORTER) {
    throw new ApiError(404, 'Peer supporter not found');
  }

  const peerProfile = await PeerSupporterProfile.findOne({ userId: supporterId });
  if (!peerProfile || !peerProfile.isVerified) {
    throw new ApiError(403, 'This peer supporter is not available for booking');
  }

  let filter = { supporterId, isActive: true };

  // Only show future slots
  filter.date = { $gte: new Date() };

  if (startDate && endDate) {
    filter.date = {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    };
  }

  const availability = await Availability.find(filter)
    .sort({ date: 1, startTime: 1 });

  return res
    .status(200)
    .json(new ApiResponse(200, availability, 'Available slots retrieved successfully'));
});

/**
 * Update an availability slot
 * @route PUT /api/availability/:availabilityId
 * @access Private (peer_supporter only)
 */
export const updateAvailability = asyncHandler(async (req, res) => {
  const { availabilityId } = req.params;
  const { startTime, endTime, slotDuration, notes, isActive } = req.body;
  const supporterId = req.user._id;

  // Validate user is a peer supporter
  const user = await User.findById(supporterId);
  if (!user || user.role !== USER_ROLES.PEER_SUPPORTER) {
    throw new ApiError(403, 'Only peer supporters can update availability');
  }

  const availability = await Availability.findById(availabilityId);
  if (!availability) {
    throw new ApiError(404, 'Availability slot not found');
  }

  // Verify ownership
  if (availability.supporterId.toString() !== supporterId.toString()) {
    throw new ApiError(403, 'You can only update your own availability');
  }

  // Update fields
  if (startTime) availability.startTime = startTime;
  if (endTime) availability.endTime = endTime;
  if (slotDuration) availability.slotDuration = slotDuration;
  if (notes) availability.notes = notes;
  if (isActive !== undefined) availability.isActive = isActive;

  await availability.save();

  return res
    .status(200)
    .json(new ApiResponse(200, availability, 'Availability slot updated successfully'));
});

/**
 * Delete an availability slot
 * @route DELETE /api/availability/:availabilityId
 * @access Private (peer_supporter only)
 */
export const deleteAvailability = asyncHandler(async (req, res) => {
  const { availabilityId } = req.params;
  const supporterId = req.user._id;

  // Validate user is a peer supporter
  const user = await User.findById(supporterId);
  if (!user || user.role !== USER_ROLES.PEER_SUPPORTER) {
    throw new ApiError(403, 'Only peer supporters can delete availability');
  }

  const availability = await Availability.findById(availabilityId);
  if (!availability) {
    throw new ApiError(404, 'Availability slot not found');
  }

  // Verify ownership
  if (availability.supporterId.toString() !== supporterId.toString()) {
    throw new ApiError(403, 'You can only delete your own availability');
  }

  await Availability.findByIdAndDelete(availabilityId);

  return res
    .status(200)
    .json(new ApiResponse(200, null, 'Availability slot deleted successfully'));
});

/**
 * Get available counselors (for users to browse)
 * @route GET /api/availability/available-counselors
 * @access Public
 */
export const getAvailableCounselors = asyncHandler(async (req, res) => {
  const { date } = req.query;

  if (!date) {
    throw new ApiError(400, 'Date parameter is required');
  }

  const selectedDate = new Date(date);
  const dateOnly = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());

  // Find all availability entries for the selected date
  const availabilities = await Availability.find({
    date: {
      $gte: dateOnly,
      $lt: new Date(dateOnly.getTime() + 24 * 60 * 60 * 1000),
    },
    isActive: true,
  }).populate('supporterId', 'name email');

  // Get unique counselors
  const counselors = [...new Map(availabilities.map(av => [av.supporterId._id, av.supporterId])).values()];

  return res
    .status(200)
    .json(new ApiResponse(200, counselors, 'Available counselors retrieved successfully'));
});

/**
 * Check if a specific time slot is available
 * @route GET /api/availability/check
 * @access Public
 */
export const checkAvailability = asyncHandler(async (req, res) => {
  const { supporterId, date, startTime, endTime } = req.query;

  if (!supporterId || !date || !startTime || !endTime) {
    throw new ApiError(400, 'supporterId, date, startTime, and endTime are required');
  }

  const selectedDate = new Date(date);
  const dateOnly = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());

  const availability = await Availability.findOne({
    supporterId,
    date: {
      $gte: dateOnly,
      $lt: new Date(dateOnly.getTime() + 24 * 60 * 60 * 1000),
    },
    startTime: { $lte: startTime },
    endTime: { $gte: endTime },
    isActive: true,
  });

  const isAvailable = !!availability;

  return res
    .status(200)
    .json(new ApiResponse(200, { isAvailable }, isAvailable ? 'Slot is available' : 'Slot is not available'));
});

/**
 * Get availability statistics for a peer counselor
 * @route GET /api/availability/stats
 * @access Private (peer_supporter only)
 */
export const getAvailabilityStats = asyncHandler(async (req, res) => {
  const supporterId = req.user._id;

  // Validate user is a peer supporter
  const user = await User.findById(supporterId);
  if (!user || user.role !== USER_ROLES.PEER_SUPPORTER) {
    throw new ApiError(403, 'Only peer supporters can view their stats');
  }

  const totalSlots = await Availability.countDocuments({ supporterId });
  const activeSlots = await Availability.countDocuments({ supporterId, isActive: true });
  const futureSlots = await Availability.countDocuments({
    supporterId,
    isActive: true,
    date: { $gte: new Date() },
  });

  return res
    .status(200)
    .json(new ApiResponse(
      200,
      { totalSlots, activeSlots, futureSlots },
      'Availability statistics retrieved successfully'
    ));
});
