import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import Event from '../models/Event.model.js';
import { HTTP_STATUS } from '../config/constants.js';

// Build MongoDB filter object from query parameters
const buildEventQuery = (query) => {
  const filter = { status: 'published', startDate: { $gte: new Date() } };

  const directFields = ['category', 'eventType', 'deliveryMode', 'venueType', 'ageGroup', 'genderFocus', 'language'];
  directFields.forEach((field) => {
    if (query[field]) filter[field] = query[field];
  });

  if (query.minPrice || query.maxPrice) {
    filter.price = {};
    if (query.minPrice) filter.price.$gte = Number(query.minPrice);
    if (query.maxPrice) filter.price.$lte = Number(query.maxPrice);
  }

  if (query.startDate) {
    filter.startDate.$gte = new Date(query.startDate);
  }

  if (query.minDuration || query.maxDuration) {
    filter.duration = {};
    if (query.minDuration) filter.duration.$gte = Number(query.minDuration);
    if (query.maxDuration) filter.duration.$lte = Number(query.maxDuration);
  }

  if (query.minCapacity) {
    filter.capacity = { $gte: Number(query.minCapacity) };
  }

  if (query.minRating) {
    filter.rating = { $gte: Number(query.minRating) };
  }

  if (query.search) {
    filter.$text = { $search: query.search };
  }

  return filter;
};

// POST /api/events
export const createEvent = asyncHandler(async (req, res) => {
  const event = await Event.create({ ...req.body, counselorId: req.user._id });
  res
    .status(HTTP_STATUS.CREATED)
    .json(new ApiResponse(HTTP_STATUS.CREATED, { event }, 'Event created'));
});

// GET /api/events  (public)
export const listEvents = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 12;
  const skip = (page - 1) * limit;
  const sort = req.query.sort === 'rating' ? { rating: -1 } : { startDate: 1 };

  const filter = buildEventQuery(req.query);

  const [events, total] = await Promise.all([
    Event.find(filter)
      .populate('counselorId', 'name avatar')
      .sort(sort)
      .skip(skip)
      .limit(limit),
    Event.countDocuments(filter),
  ]);

  res.json(
    new ApiResponse(HTTP_STATUS.OK, { events, total, page, pages: Math.ceil(total / limit) })
  );
});

// GET /api/events/:id  (public)
export const getEventById = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id).populate('counselorId', 'name avatar');
  if (!event) throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Event not found');
  res.json(new ApiResponse(HTTP_STATUS.OK, { event }));
});

// PUT /api/events/:id  (counselor, own event)
export const updateEvent = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Event not found');
  if (String(event.counselorId) !== String(req.user._id) && req.user.role !== 'admin') {
    throw new ApiError(HTTP_STATUS.FORBIDDEN, 'Not authorized to update this event');
  }

  // Recalculate seatsAvailable if capacity changes
  if (req.body.capacity && req.body.capacity !== event.capacity) {
    const booked = event.capacity - event.seatsAvailable;
    req.body.seatsAvailable = req.body.capacity - booked;
  }

  const updated = await Event.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  res.json(new ApiResponse(HTTP_STATUS.OK, { event: updated }, 'Event updated'));
});

// DELETE /api/events/:id  (counselor, own event)
export const deleteEvent = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Event not found');
  if (String(event.counselorId) !== String(req.user._id) && req.user.role !== 'admin') {
    throw new ApiError(HTTP_STATUS.FORBIDDEN, 'Not authorized to delete this event');
  }

  // Soft-cancel rather than hard delete to preserve booking records
  event.status = 'cancelled';
  await event.save();
  res.json(new ApiResponse(HTTP_STATUS.OK, {}, 'Event cancelled'));
});

// GET /api/events/counselor/me
export const getMyCounselorEvents = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 12;
  const skip = (page - 1) * limit;

  const filter = { counselorId: req.user._id };
  if (req.query.status) filter.status = req.query.status;

  const [events, total] = await Promise.all([
    Event.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Event.countDocuments(filter),
  ]);

  res.json(
    new ApiResponse(HTTP_STATUS.OK, { events, total, page, pages: Math.ceil(total / limit) })
  );
});
