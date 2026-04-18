import mongoose from 'mongoose';
import { EMERGENCY_RELATIONSHIP } from '../config/crisis.config.js';

/**
 * Guardian Signup Details Schema
 * Tracks guardian account creation process and verification status
 */
const guardianSignupSchema = new mongoose.Schema(
  {
    // Reference to the created user account
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    
    // Reference to emergency contact record that triggered the signup
    emergencyContactId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EmergencyContact',
      required: true,
      index: true,
    },
    
    // Reference to the user being monitored
    monitoredUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    
    // Guardian signup information
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    
    phoneNumber: {
      type: String,
      sparse: true,
      trim: true,
    },
    
    relationship: {
      type: String,
      enum: Object.values(EMERGENCY_RELATIONSHIP),
      required: true,
    },
    
    // Invitation & Token Information
    invitationToken: {
      type: String,
      required: true,
      select: false, // Don't include in queries by default for security
    },
    
    inviteTokenHash: {
      type: String,
      required: true,
      select: false, // Hash for verification (already stored in EmergencyContact)
    },
    
    tokenVerifiedAt: {
      type: Date,
      default: null,
    },
    
    // Account verification status
    signupStatus: {
      type: String,
      enum: ['pending', 'verified', 'rejected', 'expired'],
      default: 'pending',
      index: true,
    },
    
    emailVerified: {
      type: Boolean,
      default: false,
    },
    
    // Signup completion info
    signupCompletedAt: {
      type: Date,
      default: null,
    },
    
    signupIpAddress: {
      type: String,
      default: null,
    },
    
    signupUserAgent: {
      type: String,
      default: null,
    },
    
    // Consent & Permissions
    consentsToMonitoring: {
      type: Boolean,
      default: false,
    },
    
    consentGivenAt: {
      type: Date,
      default: null,
    },
    
    termsAccepted: {
      type: Boolean,
      default: false,
    },
    
    termsAcceptedAt: {
      type: Date,
      default: null,
    },
    
    privacyPolicyAccepted: {
      type: Boolean,
      default: false,
    },
    
    privacyPolicyAcceptedAt: {
      type: Date,
      default: null,
    },
    
    // Additional permissions
    notificationPreferences: {
      emailAlerts: {
        type: Boolean,
        default: true,
      },
      smsAlerts: {
        type: Boolean,
        default: false,
      },
      pushNotifications: {
        type: Boolean,
        default: true,
      },
    },
    
    // Signup failure tracking
    failureReason: {
      type: String,
      default: null,
    },
    
    failureCount: {
      type: Number,
      default: 0,
    },
    
    lastFailureAt: {
      type: Date,
      default: null,
    },
    
    // Metadata
    metadata: {
      source: {
        type: String,
        enum: ['invitation_email', 'direct_link', 'manual', 'other'],
        default: 'invitation_email',
      },
      referralCode: {
        type: String,
        default: null,
      },
      campaignId: {
        type: String,
        default: null,
      },
    },
  },
  {
    timestamps: true, // createdAt, updatedAt
    indexes: [
      { userId: 1, monitoredUserId: 1, unique: true },
      { userId: 1, emergencyContactId: 1 },
      { monitoredUserId: 1, signupStatus: 1 },
      { email: 1, signupStatus: 1 },
    ],
  }
);

// Index for finding active guardians
guardianSignupSchema.index({ monitoredUserId: 1, signupStatus: 'verified' });

// Index for finding pending invitations
guardianSignupSchema.index({ signupStatus: 1, createdAt: -1 });

/**
 * Methods
 */

// Mark signup as verified
guardianSignupSchema.methods.markAsVerified = function() {
  this.signupStatus = 'verified';
  this.tokenVerifiedAt = new Date();
  return this.save();
};

// Mark signup as rejected
guardianSignupSchema.methods.markAsRejected = function(reason) {
  this.signupStatus = 'rejected';
  this.failureReason = reason;
  return this.save();
};

// Check if invitation is expired
guardianSignupSchema.methods.isExpired = function(expiryDays = 7) {
  const expiryTime = new Date(this.createdAt.getTime() + expiryDays * 24 * 60 * 60 * 1000);
  return new Date() > expiryTime;
};

// Get guardian's relevant information
guardianSignupSchema.methods.getGuardianInfo = function() {
  return {
    userId: this._id,
    guardianId: this.userId,
    monitoredUserId: this.monitoredUserId,
    email: this.email,
    fullName: this.fullName,
    relationship: this.relationship,
    signupStatus: this.signupStatus,
    emailVerified: this.emailVerified,
    signupCompletedAt: this.signupCompletedAt,
  };
};

/**
 * Statics
 */

// Find all guardians for a specific user
guardianSignupSchema.statics.findGuardiansFor = function(monitoredUserId) {
  return this.find({
    monitoredUserId,
    signupStatus: 'verified',
  }).populate('userId', 'name email avatar');
};

// Find pending invitations expiring soon
guardianSignupSchema.statics.findExpiringInvitations = function(daysUntilExpiry = 1) {
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + daysUntilExpiry);
  
  return this.find({
    signupStatus: 'pending',
    createdAt: {
      $lt: new Date(expiryDate.getTime() - 6 * 24 * 60 * 60 * 1000), // 6 days old, expiring in 1 day
    },
  });
};

// Get signup statistics
guardianSignupSchema.statics.getSignupStats = async function() {
  return this.aggregate([
    {
      $group: {
        _id: '$signupStatus',
        count: { $sum: 1 },
      },
    },
  ]);
};

export default mongoose.model('GuardianSignup', guardianSignupSchema);
