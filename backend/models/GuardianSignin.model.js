import mongoose from 'mongoose';

/**
 * Guardian Signin Details Schema
 * Tracks guardian login sessions and signin activity
 */
const guardianSigninSchema = new mongoose.Schema(
  {
    // Reference to the guardian user
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
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
    
    // Guardian email (for quick reference)
    guardianEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    
    // Signin session information
    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    
    accessToken: {
      type: String,
      required: true,
      select: false, // Don't include in queries by default for security
    },
    
    refreshToken: {
      type: String,
      required: true,
      select: false, // Don't include in queries by default for security
    },
    
    // Login details
    signinAt: {
      type: Date,
      default: () => new Date(),
      index: true,
    },
    
    signoutAt: {
      type: Date,
      default: null,
    },
    
    lastActivityAt: {
      type: Date,
      default: () => new Date(),
    },
    
    sessionDuration: {
      type: Number, // Duration in seconds
      default: null,
    },
    
    // Device information
    deviceInfo: {
      userAgent: String,
      ipAddress: String,
      deviceType: {
        type: String,
        enum: ['mobile', 'tablet', 'desktop', 'unknown'],
        default: 'unknown',
      },
      browser: String,
      operatingSystem: String,
      deviceName: String,
    },
    
    // Location information (if GPS enabled)
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
      },
      country: String,
      state: String,
      city: String,
      timezone: String,
    },
    
    // Authentication details
    authMethod: {
      type: String,
      enum: ['email_password', 'oauth', 'two_factor', 'biometric', 'other'],
      default: 'email_password',
    },
    
    twoFactorVerified: {
      type: Boolean,
      default: false,
    },
    
    twoFactorVerifiedAt: {
      type: Date,
      default: null,
    },
    
    // Session status
    status: {
      type: String,
      enum: ['active', 'inactive', 'expired', 'revoked', 'suspended'],
      default: 'active',
      index: true,
    },
    
    // Activity tracking
    requestCount: {
      type: Number,
      default: 0,
    },
    
    activityLog: [
      {
        action: {
          type: String,
          enum: [
            'viewed_dashboard',
            'viewed_mood',
            'viewed_goals',
            'viewed_session',
            'sent_message',
            'viewed_alert',
            'accessed_reports',
            'changed_settings',
            'other',
          ],
        },
        timestamp: {
          type: Date,
          default: () => new Date(),
        },
        details: String,
      },
    ],
    
    // Security tracking
    suspiciousActivity: {
      flagged: {
        type: Boolean,
        default: false,
      },
      reason: String,
      flaggedAt: Date,
      resolvedAt: Date,
    },
    
    // Token expiry
    accessTokenExpiresAt: {
      type: Date,
      required: true,
    },
    
    refreshTokenExpiresAt: {
      type: Date,
      required: true,
    },
    
    // Metadata
    metadata: {
      loginAttempt: {
        type: Number,
        default: 1,
      },
      failedAttempts: {
        type: Number,
        default: 0,
      },
      captchaRequired: {
        type: Boolean,
        default: false,
      },
      notes: String,
    },
  },
  {
    timestamps: true, // createdAt, updatedAt
    indexes: [
      { userId: 1, signinAt: -1 },
      { monitoredUserId: 1, status: 1 },
      { sessionId: 1, status: 1 },
      { guardianEmail: 1, signinAt: -1 },
    ],
  }
);

// Index for finding active sessions
guardianSigninSchema.index({ userId: 1, status: 'active' });

// Index for finding recent logins
guardianSigninSchema.index({ userId: 1, signinAt: -1 });

/**
 * Methods
 */

// Calculate session duration
guardianSigninSchema.methods.calculateSessionDuration = function() {
  if (this.signoutAt) {
    this.sessionDuration = Math.floor((this.signoutAt - this.signinAt) / 1000);
  }
  return this.sessionDuration;
};

// Mark session as ended
guardianSigninSchema.methods.endSession = function() {
  this.signoutAt = new Date();
  this.status = 'inactive';
  this.calculateSessionDuration();
  return this.save();
};

// Update last activity
guardianSigninSchema.methods.updateLastActivity = function() {
  this.lastActivityAt = new Date();
  this.requestCount += 1;
  return this.save();
};

// Log activity
guardianSigninSchema.methods.logActivity = function(action, details) {
  this.activityLog.push({
    action,
    timestamp: new Date(),
    details,
  });
  
  // Keep only last 100 activities
  if (this.activityLog.length > 100) {
    this.activityLog = this.activityLog.slice(-100);
  }
  
  return this.save();
};

// Mark as suspicious
guardianSigninSchema.methods.flagAsSuspicious = function(reason) {
  this.suspiciousActivity.flagged = true;
  this.suspiciousActivity.reason = reason;
  this.suspiciousActivity.flaggedAt = new Date();
  this.status = 'suspended';
  return this.save();
};

// Resolve suspicious activity
guardianSigninSchema.methods.resolveSuspiciousActivity = function() {
  this.suspiciousActivity.flagged = false;
  this.suspiciousActivity.resolvedAt = new Date();
  this.status = 'active';
  return this.save();
};

// Check if session is expired
guardianSigninSchema.methods.isExpired = function() {
  return new Date() > this.accessTokenExpiresAt;
};

// Get session summary
guardianSigninSchema.methods.getSessionSummary = function() {
  return {
    sessionId: this.sessionId,
    userId: this.userId,
    signinAt: this.signinAt,
    signoutAt: this.signoutAt,
    status: this.status,
    duration: this.calculateSessionDuration(),
    deviceInfo: this.deviceInfo,
    activityCount: this.activityLog.length,
    suspiciousActivity: this.suspiciousActivity.flagged,
  };
};

/**
 * Statics
 */

// Find all active sessions for a guardian
guardianSigninSchema.statics.findActiveSessions = function(userId) {
  return this.find({
    userId,
    status: 'active',
  }).sort({ signinAt: -1 });
};

// Find all sessions for a guardian
guardianSigninSchema.statics.findUserSessions = function(userId, limit = 10) {
  return this.find({ userId })
    .sort({ signinAt: -1 })
    .limit(limit)
    .populate('userId', 'name email');
};

// Find sessions for a monitored user
guardianSigninSchema.statics.findGuardianSessionsForUser = function(monitoredUserId, limit = 10) {
  return this.find({ monitoredUserId })
    .sort({ signinAt: -1 })
    .limit(limit)
    .populate('userId', 'name email');
};

// Revoke all sessions for a user
guardianSigninSchema.statics.revokeAllUserSessions = function(userId) {
  return this.updateMany(
    { userId, status: 'active' },
    { $set: { status: 'revoked', signoutAt: new Date() } }
  );
};

// Get login statistics
guardianSigninSchema.statics.getLoginStats = async function(userId) {
  return this.aggregate([
    {
      $match: { userId: new mongoose.Types.ObjectId(userId) },
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
      },
    },
  ]);
};

// Find suspicious sessions
guardianSigninSchema.statics.findSuspiciousSessions = function() {
  return this.find({
    'suspiciousActivity.flagged': true,
    'suspiciousActivity.resolvedAt': null,
  }).sort({ 'suspiciousActivity.flaggedAt': -1 });
};

export default mongoose.model('GuardianSignin', guardianSigninSchema);
