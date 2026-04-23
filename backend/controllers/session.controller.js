import mongoose from 'mongoose';
import SessionBooking from '../models/SessionBooking.model.js';
import User from '../models/User.model.js';
import Availability from '../models/Availability.model.js';
import Notification from '../models/Notification.model.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';

// Book a session with a peer counselor
export const bookSession = asyncHandler(async (req, res) => {
  const { supporterId, sessionDate, sessionTime, startTime, endTime, topic, notes = '' } = req.body;
  const userId = req.user._id;

  // Use startTime if provided (new format), fallback to sessionTime (legacy)
  const bookingStartTime = startTime || sessionTime;
  const bookingEndTime = endTime;

  // Validate required fields
  if (!supporterId || !sessionDate || !bookingStartTime || !topic) {
    throw new ApiError(400, 'Missing required fields: supporterId, sessionDate, startTime, topic');
  }

  // Convert supporterId to ObjectId for proper querying
  let supporterObjectId;
  try {
    supporterObjectId = new mongoose.Types.ObjectId(supporterId);
  } catch (error) {
    throw new ApiError(400, 'Invalid supporter ID format');
  }

  // Check if supporter exists and is a peer supporter
  const supporter = await User.findById(supporterObjectId);
  if (!supporter) {
    throw new ApiError(404, 'Peer counselor not found');
  }

  if (supporter.role !== 'peer_supporter') {
    throw new ApiError(400, 'Selected user is not a peer counselor');
  }

  // Prevent self-booking
  if (userId.toString() === supporterObjectId.toString()) {
    throw new ApiError(400, 'You cannot book a session with yourself');
  }

  // Parse sessionDate in YYYY-MM-DD format to avoid timezone issues
  const [year, month, day] = sessionDate.split('-').map(Number);
  const dateStart = new Date(Date.UTC(year, month - 1, day));
  const dateEnd = new Date(Date.UTC(year, month - 1, day + 1));

  // Check for conflicting bookings - check for overlap
  const existingBookings = await SessionBooking.find({
    supporterId: supporterObjectId,
    sessionDate: {
      $gte: dateStart,
      $lt: dateEnd,
    },
    status: { $in: ['pending', 'confirmed'] },
  });

  // Check if requested time overlaps with any existing booking
  const conflictingBooking = existingBookings.some((booking) => {
    const bookingStart = parseInt(booking.sessionTime.split(':')[0]) * 60 + parseInt(booking.sessionTime.split(':')[1]);
    const requestStart = parseInt(bookingStartTime.split(':')[0]) * 60 + parseInt(bookingStartTime.split(':')[1]);
    const bookingEnd = bookingStart + (booking.sessionDuration || 60);
    const requestEnd = bookingEndTime 
      ? (parseInt(bookingEndTime.split(':')[0]) * 60 + parseInt(bookingEndTime.split(':')[1]))
      : requestStart + 60;
    
    return requestStart < bookingEnd && requestEnd > bookingStart;
  });

  if (conflictingBooking) {
    throw new ApiError(409, 'This time slot conflicts with an existing booking. Please choose another time.');
  }

  // Check if the time slot matches peer counselor's availability for this specific date
  const availabilitySlots = await Availability.find({
    supporterId: supporterObjectId,
    date: {
      $gte: dateStart,
      $lt: dateEnd,
    },
    isActive: true,
  });

  if (availabilitySlots.length === 0) {
    throw new ApiError(400, 'Peer counselor is not available on this date');
  }

  // Check if requested time falls within any availability window
  let isTimeValid = false;
  let duration = 60;

  for (const av of availabilitySlots) {
    const [avStartH, avStartM] = av.startTime.split(':');
    const [avEndH, avEndM] = av.endTime.split(':');
    const [reqH, reqM] = bookingStartTime.split(':');

    const avStart = parseInt(avStartH) * 60 + parseInt(avStartM);
    const avEnd = parseInt(avEndH) * 60 + parseInt(avEndM);
    const reqStart = parseInt(reqH) * 60 + parseInt(reqM);
    const reqEnd = bookingEndTime 
      ? (parseInt(bookingEndTime.split(':')[0]) * 60 + parseInt(bookingEndTime.split(':')[1]))
      : reqStart + (av.slotDuration || 60);

    duration = av.slotDuration || 60;

    if (reqStart >= avStart && reqEnd <= avEnd) {
      isTimeValid = true;
      break;
    }
  }

  if (!isTimeValid) {
    const avWindow = availabilitySlots[0];
    throw new ApiError(
      400,
      `Peer counselor is available from ${avWindow.startTime} to ${avWindow.endTime} on this date`
    );
  }

  // Create the session booking
  const sessionBooking = await SessionBooking.create({
    userId,
    supporterId: supporterObjectId,
    topic,
    notes,
    sessionDate: dateStart,
    sessionTime: bookingStartTime,
    sessionDuration: bookingEndTime 
      ? (parseInt(bookingEndTime.split(':')[0]) * 60 + parseInt(bookingEndTime.split(':')[1])) - 
        (parseInt(bookingStartTime.split(':')[0]) * 60 + parseInt(bookingStartTime.split(':')[1]))
      : duration,
  });

  // Create notification for peer counselor
  try {
    await Notification.create({
      userId: supporterObjectId,
      type: 'session_booked',
      title: 'New Session Booking',
      message: `${req.user.name} has booked a session with you for ${topic}`,
      relatedData: {
        sessionId: sessionBooking._id,
        userId: userId,
        userName: req.user.name,
      },
    });

    // Emit real-time notification via Socket.IO
    if (req.app && req.app.io) {
      const supporterIdStr = supporterObjectId.toString();
      const eventData = {
        sessionId: sessionBooking._id,
        userId: userId,
        userName: req.user.name,
        topic,
        sessionDate: dateStart,
        sessionTime: bookingStartTime,
      };
      
      req.app.io.to(supporterIdStr).emit('session_booked', eventData);
      console.log(`✅ Emitted session_booked to room ${supporterIdStr}:`, eventData);
    } else {
      console.error('❌ io instance not available on req.app');
    }
  } catch (notifError) {
    console.error('Error creating notification:', notifError);
    // Don't fail the booking if notification fails
  }

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

// Cancel a session - both user and peer counselor can cancel
export const cancelSession = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  const { reason = '' } = req.body;
  const userId = req.user._id;

  const session = await SessionBooking.findById(sessionId);

  if (!session) {
    throw new ApiError(404, 'Session not found');
  }

  // Both user and supporter can cancel
  const isUser = session.userId.toString() === userId.toString();
  const isSupporter = session.supporterId.toString() === userId.toString();

  if (!isUser && !isSupporter) {
    throw new ApiError(403, 'You can only cancel your own sessions');
  }

  if (session.status === 'completed') {
    throw new ApiError(400, 'Cannot cancel a completed session');
  }

  session.status = 'cancelled';
  session.cancelledBy = userId;
  session.cancellationReason = reason;
  await session.save();

  // Populate for response
  await session.populate('userId', 'name email');
  await session.populate('supporterId', 'name email');

  // Create notification for the other party
  try {
    const recipientId = session.userId._id.toString() === userId.toString() 
      ? session.supporterId._id 
      : session.userId._id;
    
    await Notification.create({
      userId: recipientId,
      type: 'session_cancelled',
      title: 'Session Cancelled',
      message: `A session scheduled for ${new Date(session.sessionDate).toLocaleDateString()} has been cancelled`,
      relatedData: {
        sessionId: session._id,
      },
    });

    // Emit real-time update to the other party
    if (req.app && req.app.io) {
      const recipientIdStr = recipientId.toString();
      const eventData = {
        sessionId: session._id,
        newStatus: 'cancelled',
        reason: reason,
        cancelledAt: new Date(),
      };
      
      req.app.io.to(recipientIdStr).emit('session_status_changed', eventData);
      console.log(`✅ Emitted session_status_changed to room ${recipientIdStr}:`, eventData);
    } else {
      console.error('❌ io instance not available on req.app');
    }
  } catch (notifError) {
    console.error('Error creating cancellation notification:', notifError);
  }

  return res.status(200).json(new ApiResponse(200, session, 'Session cancelled successfully'));
});

// Accept a session - peer counselor accepts pending session
export const acceptSession = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  const supporterId = req.user._id;

  // Only peer supporters can accept sessions
  if (req.user.role !== 'peer_supporter') {
    throw new ApiError(403, 'Only peer counselors can accept sessions');
  }

  const session = await SessionBooking.findById(sessionId);

  if (!session) {
    throw new ApiError(404, 'Session not found');
  }

  // Session must be for this supporter
  if (session.supporterId.toString() !== supporterId.toString()) {
    throw new ApiError(403, 'You can only accept sessions booked with you');
  }

  // Can only accept pending sessions
  if (session.status !== 'pending') {
    throw new ApiError(400, `Cannot accept a ${session.status} session`);
  }

  session.status = 'confirmed';
  session.confirmedAt = new Date();
  await session.save();

  // Populate for response
  await session.populate('userId', 'name email');
  await session.populate('supporterId', 'name email');

  // Create notification for the user
  try {
    await Notification.create({
      userId: session.userId._id,
      type: 'session_accepted',
      title: 'Session Confirmed',
      message: `${session.supporterId.name} has accepted your session request for ${session.topic}`,
      relatedData: {
        sessionId: session._id,
        supporterId: session.supporterId._id,
      },
    });

    // Emit real-time update to user's room
    if (req.app && req.app.io) {
      const userId = session.userId._id.toString();
      const eventData = {
        sessionId: session._id,
        newStatus: 'confirmed',
        supporterName: session.supporterId.name,
        confirmedAt: session.confirmedAt,
      };
      
      req.app.io.to(userId).emit('session_status_changed', eventData);
      console.log(`✅ Emitted session_status_changed to room ${userId}:`, eventData);
    } else {
      console.error('❌ io instance not available on req.app');
    }
  } catch (notifError) {
    console.error('Error creating acceptance notification:', notifError);
  }

  return res.status(200).json(new ApiResponse(200, session, 'Session accepted successfully'));
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
    // Convert supporterId string to MongoDB ObjectId for proper querying
    let supporterObjectId;
    try {
      supporterObjectId = new mongoose.Types.ObjectId(supporterId);
    } catch (error) {
      throw new ApiError(400, 'Invalid supporter ID format');
    }

    // Parse date string in YYYY-MM-DD format to avoid timezone issues
    const [year, month, day] = date.split('-').map(Number);
    const dateStart = new Date(Date.UTC(year, month - 1, day));
    const dateEnd = new Date(Date.UTC(year, month - 1, day + 1));

    // Get availability for the specific date
    const availabilities = await Availability.find({
      supporterId: supporterObjectId,
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
      supporterId: supporterObjectId,
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

        // Check if slot is already booked or conflicts with booked sessions
        const isBooked = bookedSessions.some((b) => {
          const bookingStart = parseInt(b.sessionTime.split(':')[0]) * 60 + parseInt(b.sessionTime.split(':')[1]);
          const slotStart = parseInt(slotTime.split(':')[0]) * 60 + parseInt(slotTime.split(':')[1]);
          const bookingEnd = bookingStart + (b.sessionDuration || 60);
          const slotEnd = parseInt(slotEndTimeStr.split(':')[0]) * 60 + parseInt(slotEndTimeStr.split(':')[1]);
          
          return slotStart < bookingEnd && slotEnd > bookingStart;
        });

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
