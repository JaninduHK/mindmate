// config/crisis.config.js
// Crisis Detection & Emergency Response System Constants & Configuration

export const CRISIS_CONFIG = {
  // Invitation settings
  INVITATION: {
    EXPIRY_DAYS: 7,
    TOKEN_LENGTH: 32,
  },

  // Inactivity detection thresholds (in hours)
  INACTIVITY: {
    WARNING_THRESHOLD_HOURS: 48,       // When to send reminder to primary user
    CONTACT_ALERT_THRESHOLD_HOURS: 72, // When to alert emergency contacts
    CHECK_INTERVAL_MINUTES: 60,        // How often to run the detection job
  },

  // Emergency mode settings
  EMERGENCY: {
    LOCATION_REQUIRED: false,          // Don't require location to activate emergency mode
    LOCATION_PRECISION_DECIMALS: 4,    // Limit GPS precision to ~11m accuracy in logs
  },

  // Content recommendation defaults
  CONTENT: {
    DEFAULT_LIMIT: 10,
    HIGH_RISK_THRESHOLD: 70,          // Risk score >= this triggers high-risk content filter
    MEDIUM_RISK_THRESHOLD: 40,
  },

  // Notification retention (days)
  NOTIFICATION: {
    RETENTION_DAYS: 90,
    ARCHIVE_BATCH_SIZE: 1000,
  },

  // Rate limiting
  RATE_LIMIT: {
    INVITE_SEND_PER_HOUR: 5,
    INVITE_ACCEPT_PER_HOUR: 10,
    EMERGENCY_ACTIVATE_PER_HOUR: 3,
  },

  // SMS & Email settings
  COMMUNICATION: {
    SENDER_EMAIL: process.env.EMAIL_FROM || 'noreply@mindmate.com',
    SENDER_NAME: 'MindMate Support',
    SMS_MAX_LENGTH: 160,
  },

  // Feature flags
  FEATURES: {
    REQUIRE_EMERGENCY_CONTACT_ON_SIGNUP: process.env.REQUIRE_EMERGENCY_CONTACT_ON_SIGNUP === 'true' ? true : false,
    MOCK_EMAIL: process.env.MOCK_EMAIL === 'true' ? true : (process.env.NODE_ENV !== 'production'),
    MOCK_SMS: process.env.MOCK_SMS === 'true' ? true : (process.env.NODE_ENV !== 'production'),
  },

  // Public numbers for display
  PUBLIC_NUMBERS: {
    EMERGENCY_NUMBER: process.env.PUBLIC_EMERGENCY_NUMBER || '119',     // Sri Lanka emergency
    CRISIS_HOTLINE: process.env.PUBLIC_CRISIS_HOTLINE_NUMBER || '1234', // Placeholder
  },
};

export const INVITATION_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  EXPIRED: 'expired',
  REVOKED: 'revoked',
  FAILED: 'failed',
};

export const DELIVERY_STATUS = {
  QUEUED: 'queued',
  SENT: 'sent',
  FAILED: 'failed',
  SKIPPED: 'skipped',
};

export const NOTIFICATION_TYPE = {
  INACTIVITY: 'inactivity',
  CONTENT_SUGGESTION: 'content_suggestion',
  EMERGENCY_CONTACT_UPDATED: 'emergency_contact_updated',
  EMERGENCY_ACTIVATED: 'emergency_activated',
  HIGH_RISK: 'high_risk',
  SYSTEM: 'system',
};

export const NOTIFICATION_SEVERITY = {
  INFO: 'info',
  WARNING: 'warning',
  EMERGENCY: 'emergency',
};

export const USER_ROLE = {
  USER: 'user',
  EMERGENCY_CONTACT: 'emergency_contact',
  ADMIN: 'admin',
};

export const EMERGENCY_RELATIONSHIP = {
  SISTER: 'sister',
  BROTHER: 'brother',
  MOTHER: 'mother',
  FATHER: 'father',
  PARTNER: 'partner',
  THERAPIST: 'therapist',
  FRIEND: 'friend',
  OTHER: 'other',
};

export const CONTENT_TYPE = {
  VIDEO: 'video',
  ARTICLE: 'article',
  AUDIO: 'audio',
  STORY: 'story',
};

export const CONTENT_RISK_LEVEL = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
};
