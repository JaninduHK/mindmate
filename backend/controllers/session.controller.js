import SessionBooking from '../models/SessionBooking.model.js';
import User from '../models/User.model.js';
import Availability from '../models/Availability.model.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';

// Book a session with a peer counselor
export const bookSession = asyncHandler(async (req, res) => {
  const { supporterId, sessionDate, sessionTime, topic, notes = '' } = req.body;
  const userId = req.user._id;

  // Validate required fields
  if (!supporterId || !sessionDate || !sessionTime || !topic) {
    throw new ApiError(400, 'Missing required fields');
  }

  // Check if supporter exists and is a peer supporter
  const supporter = await User.findById(supporterId);
  if (!supporter) {
    throw new ApiError(404, 'Peer counselor not found');
  }

  if (supporter.role !== 'peer_supporter') {
    throw new ApiError(400, 'Selected user is not a peer counselor');
  }

  // Prevent self-booking
  if (userId.toString() === supporterId) {
    throw new ApiError(400, 'You cannot book a session with yourself');
  }

  // Parse sessionDate in YYYY-MM-DD format to avoid timezone issues
  const [year, month, day] = sessionDate.split('-').map(Number);
  const dateStart = new Date(Date.UTC(year, month - 1, day));
  const dateEnd = new Date(Date.UTC(year, month - 1, day + 1));

  // Check for conflicting bookings
  const existingBooking = await SessionBooking.findOne({
    supporterId,
    sessionDate: {
      $gte: dateStart,
      $lt: dateEnd,
    },
    sessionTime,
    status: { $in: ['pending', 'confirmed'] },
  });

  if (existingBooking) {
    throw new ApiError(409, 'This time slot is already booked. Please choose another time.');
  }

  // Check if the time slot matches peer counselor's availability for this specific date
  const availabilitySlot = await Availability.findOne({
    supporterId,
    date: {
      $gte: dateStart,
      $lt: dateEnd,
    },
    isActive: true,
  });

  if (!availabilitySlot) {
    throw new ApiError(400, 'Peer counselor is not available on this date');
  }

  // Check if requested time falls within availability window
  const [reqH, reqM] = sessionTime.split(':');
  const [avStartH, avStartM] = availabilitySlot.startTime.split(':');
  const [avEndH, avEndM] = availabilitySlot.endTime.split(':');

  const reqTime = parseInt(reqH) * 60 + parseInt(reqM);
  const avStart = parseInt(avStartH) * 60 + parseInt(avStartM);
  const avEnd = parseInt(avEndH) * 60 + parseInt(avEndM);

  if (reqTime < avStart || reqTime >= avEnd) {
    throw new ApiError(
      400,
      `Peer counselor is available from ${availabilitySlot.startTime} to ${availabilitySlot.endTime} on this date`
    );
  }

  // Create the session booking
  const sessionBooking = await SessionBooking.create({
    userId,
    supporterId,
    topic,
    notes,
    sessionDate: dateStart,
    sessionTime,
  });

  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        sessionBooking,
        'Session booked successfully. You will receive a confirmation soon.'
      )
    );
});

// Get user's booked sessions
export const getUserSessions = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const sessions = await SessionBooking.find({ userId })
    .populate('supporterId', 'name email avatar role')
    .sort({ sessionDate: -1 });

  return res
    .status(200)
    .json(new ApiResponse(200, sessions, 'Sessions retrieved successfully'));
});

// Get peer supporter's bookings
export const getSupporterBookings = asyncHandler(async (req, res) => {
  const supporterId = req.user._id;

  // Only peer supporters can view their bookings
  if (req.user.role !== 'peer_supporter') {
    throw new ApiError(403, 'Only peer counselors can access this');
  }

  const bookings = await SessionBooking.find({ supporterId })
    .populate('userId', 'name email avatar role')
    .sort({ sessionDate: 1 });

  return res
    .status(200)
    .json(new ApiResponse(200, bookings, 'Bookings retrieved successfully'));
});

// Get session details
export const getSessionDetails = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  const userId = req.user._id;

  const session = await SessionBooking.findById(sessionId)
    .populate('userId', 'name email avatar')
    .populate('supporterId', 'name email avatar');

  if (!session) {
    throw new ApiError(404, 'Session not found');
  }

  // Only participant can view
  if (
    session.userId.toString() !== userId.toString() &&
    session.supporterId._id.toString() !== userId.toString()
  ) {
    throw new ApiError(403, 'You do not have access to this session');
  }

  return res.status(200).json(new ApiResponse(200, session, 'Session details retrieved'));
});

// Cancel a session
export const cancelSession = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  const userId = req.user._id;

  const session = await SessionBooking.findById(sessionId);

  if (!session) {
    throw new ApiError(404, 'Session not found');
  }

  // Only user who booked can cancel
  if (session.userId.toString() !== userId.toString()) {
    throw new ApiError(403, 'You can only cancel your own sessions');
  }

  if (session.status === 'completed') {
    throw new ApiError(400, 'Cannot cancel a completed session');
  }

  session.status = 'cancelled';
  await session.save();

  return res.status(200).json(new ApiResponse(200, session, 'Session cancelled successfully'));
});

// Add feedback to a session
export const addSessionFeedback = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  const { rating, comment } = req.body;
  const userId = req.user._id;

  if (!rating || rating < 1 || rating > 5) {
    throw new ApiError(400, 'Rating must be between 1 and 5');
  }

  const session = await SessionBooking.findById(sessionId);

  if (!session) {
    throw new ApiError(404, 'Session not found');
  }

  if (session.userId.toString() !== userId.toString()) {
    throw new ApiError(403, 'Only session participant can add feedback');
  }

  session.feedback = {
    rating,
    comment: comment || '',
  };
  await session.save();

  return res.status(200).json(new ApiResponse(200, session, 'Feedback added successfully'));
});

// Update session details (meeting link, etc.)
export const updateSessionDetails = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  const { meetingLink, status } = req.body;
  const userId = req.user._id;

  const session = await SessionBooking.findById(sessionId);

  if (!session) {
    throw new ApiError(404, 'Session not found');
  }

  // Only supporter or user can update
  if (
    session.supporterId.toString() !== userId.toString() &&
    session.userId.toString() !== userId.toString()
  ) {
    throw new ApiError(403, 'You do not have permission to update this session');
  }

  if (meetingLink) {
    session.meetingLink = meetingLink;
  }

  if (status && ['pending', 'confirmed', 'completed', 'cancelled'].includes(status)) {
    session.status = status;
  }

  await session.save();

  return res.status(200).json(new ApiResponse(200, session, 'Session updated successfully'));
});

// Get available time slots for a peer counselor
export const getAvailableSlots = asyncHandler(async (req, res) => {
  const { supporterId, date } = req.query;

  if (!supporterId || !date) {
    throw new ApiError(400, 'supporterId and date are required');
  }

  try {
    // Parse date string in YYYY-MM-DD format to avoid timezone issues
    const [year, month, day] = date.split('-').map(Number);
    const dateStart = new Date(Date.UTC(year, month - 1, day));
    const dateEnd = new Date(Date.UTC(year, month - 1, day + 1));

    // Get availability for the specific date
    const availabilities = await Availability.find({
      supporterId,
      date: {
        $gte: dateStart,
        $lt: dateEnd,
      },
      isActive: true,
    });

    if (availabilities.length === 0) {
      return res.status(200).json(new ApiResponse(200, [], 'No availability for this date'));
    }

    // Get all booked sessions for this date
    const bookedSessions = await SessionBooking.find({
      supporterId,
      sessionDate: {
        $gte: dateStart,
        $lt: dateEnd,
      },
      status: { $in: ['pending', 'confirmed'] },
    });

    // Generate available slots for each availability window
    const slots = [];
    const selectedDate = new Date(year, month - 1, day);
    
    availabilities.forEach((av) => {
      const [startH, startM] = av.startTime.split(':');
      const [endH, endM] = av.endTime.split(':');

      let currentTime = new Date(selectedDate);
      currentTime.setHours(parseInt(startH), parseInt(startM), 0, 0);
      const endTime = new Date(selectedDate);
      endTime.setHours(parseInt(endH), parseInt(endM), 0, 0);

      while (currentTime < endTime) {
        const slotTime = currentTime.toTimeString().slice(0, 5);
        const slotEndTime = new Date(currentTime.getTime() + av.slotDuration * 60 * 1000);
        const slotEndTimeStr = slotEndTime.toTimeString().slice(0, 5);

        // Check if slot is already booked
        const isBooked = bookedSessions.some((b) => b.sessionTime === slotTime);

        if (!isBooked) {
          slots.push({
            time: slotTime,
            endTime: slotEndTimeStr,
            duration: av.slotDuration,
            available: true,
          });
        }

        currentTime = slotEndTime;
      }
    });

    return res
      .status(200)
      .json(new ApiResponse(200, slots, 'Available slots retrieved successfully'));
  } catch (error) {
    console.error('Error in getAvailableSlots:', error);
    throw new ApiError(500, 'Error fetching available slots');
  }
});
