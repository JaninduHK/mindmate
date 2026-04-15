import mongoose from 'mongoose';
import { NOTIFICATION_TYPES } from '../config/constants.js';
import { NOTIFICATION_TYPE, NOTIFICATION_SEVERITY } from '../config/crisis.config.js';

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    // NEW: Support for crisis system
    recipientUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
      // Alias for newer crisis system; userId remains for backward compat
    },
    relatedUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      // For emergency contacts to see linked primary user notifications
    },
    type: {
      type: String,
      required: true,
    },
    // NEW: severity level for crisis alerts
    severity: {
      type: String,
      enum: Object.values(NOTIFICATION_SEVERITY),
      default: 'info',
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    // NEW: structured metadata for crisis system
    metadata: {
      emergencySessionId: mongoose.Schema.Types.ObjectId,
      emergencyContactId: mongoose.Schema.Types.ObjectId,
      contentResourceId: mongoose.Schema.Types.ObjectId,
      location: {
        lat: Number,
        lng: Number,
        accuracy: Number,
      },
      mapsUrl: String,
      riskScore: Number,
      customData: mongoose.Schema.Types.Mixed,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    // NEW: timestamp for read status
    readAt: {
      type: Date,
      default: null,
    },
    archivedAt: {
      type: Date,
      default: null,
    },
  },
  { 
    timestamps: true,
  }
);

// Indexes for common queries
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ recipientUserId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, isRead: 1 });
notificationSchema.index({ type: 1 });
notificationSchema.index({ relatedUserId: 1 });

// TTL index: automatically archive old notifications
notificationSchema.index(
  { archivedAt: 1 },
  { expireAfterSeconds: 7776000, sparse: true } // 90 days
);

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;
