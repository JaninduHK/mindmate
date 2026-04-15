// models/EmergencySession.model.js
import mongoose from 'mongoose';

const emergencySessionSchema = new mongoose.Schema(
  {
    ownerUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    activatedAt: {
      type: Date,
      default: () => new Date(),
    },
    deactivatedAt: {
      type: Date,
      default: null,
    },
    activatedLocation: {
      lat: Number,
      lng: Number,
      accuracy: Number,
      source: {
        type: String,
        enum: ['gps', 'manual', 'network'],
      },
      mapsUrl: String,
      timestamp: Date,
    },
    // Snapshot of emergency contacts at activation time (for audit trail)
    contactSnapshot: [
      {
        contactId: mongoose.Schema.Types.ObjectId,
        fullName: String,
        email: String,
        phoneNumber: String,
        notificationMethod: String,
      },
    ],
    sentChannels: {
      email: {
        type: Number,
        default: 0,
      },
      sms: {
        type: Number,
        default: 0,
      },
      dashboard: {
        type: Number,
        default: 0,
      },
    },
    note: String,
    resolutionNote: String,
    // Which emergency contacts have acknowledged (e.g., viewed dashboard)
    acknowledgedByContacts: [
      {
        contactUserId: mongoose.Schema.Types.ObjectId,
        acknowledgedAt: Date,
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Indexes
emergencySessionSchema.index({ ownerUserId: 1, isActive: 1 });
emergencySessionSchema.index({ ownerUserId: 1, activatedAt: -1 });
emergencySessionSchema.index({ isActive: 1 });

const EmergencySession = mongoose.model('EmergencySession', emergencySessionSchema);

export default EmergencySession;
