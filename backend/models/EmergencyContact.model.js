// models/EmergencyContact.model.js
import mongoose from 'mongoose';
import { INVITATION_STATUS, DELIVERY_STATUS, EMERGENCY_RELATIONSHIP } from '../config/crisis.config.js';

const emergencyContactSchema = new mongoose.Schema(
  {
    ownerUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    contactUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      minlength: [2, 'Min 2 characters'],
      maxlength: [60, 'Max 60 characters'],
      match: [/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Valid email required'],
    },
    phoneNumber: {
      type: String,
      sparse: true,
      trim: true,
    },
    relationship: {
      type: String,
      enum: Object.values(EMERGENCY_RELATIONSHIP),
      required: [true, 'Relationship is required'],
    },
    inviteStatus: {
      type: String,
      enum: Object.values(INVITATION_STATUS),
      default: INVITATION_STATUS.PENDING,
      index: true,
    },
    inviteTokenHash: {
      type: String,
      default: null,
      select: false,
    },
    inviteExpiresAt: {
      type: Date,
      default: null,
    },
    deliveryStatus: {
      email: {
        type: String,
        enum: Object.values(DELIVERY_STATUS),
        default: DELIVERY_STATUS.QUEUED,
      },
      sms: {
        type: String,
        enum: Object.values(DELIVERY_STATUS),
        default: DELIVERY_STATUS.SKIPPED,
      },
    },
    isPrimarySignupContact: {
      type: Boolean,
      default: false,
    },
    lastInvitedAt: {
      type: Date,
      default: null,
    },
    // Compound index to prevent duplicates per owner
    // ownerUserId + email must be unique
  },
  {
    timestamps: true,
  }
);

// Unique compound index: one owner cannot have duplicate email/phone contacts
emergencyContactSchema.index(
  { ownerUserId: 1, email: 1 },
  { unique: true, sparse: true }
);

// Index for finding all contacts for a user
emergencyContactSchema.index({ ownerUserId: 1, inviteStatus: 1 });

// Index for finding accepted contacts (linked accounts)
emergencyContactSchema.index({ contactUserId: 1 });

const EmergencyContact = mongoose.model('EmergencyContact', emergencyContactSchema);

export default EmergencyContact;
