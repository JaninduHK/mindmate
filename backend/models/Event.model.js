import mongoose from 'mongoose';
import {
  EVENT_CATEGORIES,
  EVENT_TYPES,
  DELIVERY_MODES,
  VENUE_TYPES,
  AGE_GROUPS,
  GENDER_FOCUS,
  EVENT_STATUSES,
} from '../config/constants.js';

const eventSchema = new mongoose.Schema(
  {
    counselorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    coverImage: {
      url: { type: String, default: '' },
      publicId: { type: String, default: '' },
    },
    category: {
      type: String,
      enum: EVENT_CATEGORIES,
      required: [true, 'Category is required'],
    },
    eventType: {
      type: String,
      enum: EVENT_TYPES,
      required: [true, 'Event type is required'],
    },
    deliveryMode: {
      type: String,
      enum: DELIVERY_MODES,
      required: [true, 'Delivery mode is required'],
    },
    venueType: {
      type: String,
      enum: VENUE_TYPES,
      required: [true, 'Venue type is required'],
    },
    venue: {
      address: { type: String, default: '' },
      city: { type: String, default: '' },
      country: { type: String, default: '' },
      meetingLink: { type: String, default: '' },
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    endDate: {
      type: Date,
    },
    duration: {
      type: Number, // in minutes
      required: [true, 'Duration is required'],
      min: [1, 'Duration must be at least 1 minute'],
    },
    capacity: {
      type: Number,
      required: [true, 'Capacity is required'],
      min: [1, 'Capacity must be at least 1'],
    },
    seatsAvailable: {
      type: Number,
    },
    ageGroup: {
      type: String,
      enum: AGE_GROUPS,
      default: 'all',
    },
    genderFocus: {
      type: String,
      enum: GENDER_FOCUS,
      default: 'any',
    },
    language: {
      type: String,
      default: 'English',
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    status: {
      type: String,
      enum: EVENT_STATUSES,
      default: 'draft',
    },
    tags: {
      type: [String],
      default: [],
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    reviewCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Set seatsAvailable = capacity on first save
eventSchema.pre('save', function (next) {
  if (this.isNew) {
    this.seatsAvailable = this.capacity;
  }
  next();
});

// Text index for search
eventSchema.index({ title: 'text', description: 'text', tags: 'text' });
// Compound index for filtered queries
eventSchema.index({ status: 1, startDate: 1, category: 1 });

const Event = mongoose.model('Event', eventSchema);

export default Event;
