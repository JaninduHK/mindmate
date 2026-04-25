export const JWT_CONFIG = {
  ACCESS_TOKEN_EXPIRY: process.env.JWT_ACCESS_EXPIRY || '15m',
  REFRESH_TOKEN_EXPIRY: process.env.JWT_REFRESH_EXPIRY || '7d',
  ACCESS_TOKEN_SECRET: process.env.JWT_ACCESS_SECRET,
  REFRESH_TOKEN_SECRET: process.env.JWT_REFRESH_SECRET,
};

export const UPLOAD_CONFIG = {
  MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE) || 5242880, // 5MB
  ALLOWED_FILE_TYPES: ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'],
  CLOUDINARY_FOLDER: 'mindmate/users',
};

export const RATE_LIMIT_CONFIG = {
  WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  MAX_REQUESTS: 100,
  AUTH_MAX_REQUESTS: 5, // Stricter for auth endpoints
};

export const USER_ROLES = {
  USER: 'user',
  COUNSELOR: 'counselor',
  PEER_SUPPORTER: 'peer_supporter',
  ADMIN: 'admin',
};

export const EVENT_CATEGORIES = [
  'anxiety', 'depression', 'stress', 'mindfulness', 'grief',
  'trauma', 'relationships', 'addiction', 'parenting', 'general',
];

export const EVENT_TYPES = ['session', 'workshop', 'seminar', 'group_therapy', 'webinar'];

export const DELIVERY_MODES = ['online', 'in_person', 'hybrid'];

export const VENUE_TYPES = [
  'private_clinic', 'community_center', 'hospital', 'online_platform', 'home_visit',
];

export const AGE_GROUPS = ['children', 'teens', 'adults', 'seniors', 'all'];

export const GENDER_FOCUS = ['any', 'male', 'female', 'non_binary'];

export const EVENT_STATUSES = ['draft', 'published', 'cancelled', 'completed'];

export const BOOKING_STATUSES = ['pending', 'confirmed', 'cancelled', 'completed', 'refunded'];

export const PAYMENT_STATUSES = ['pending', 'paid', 'refunded', 'failed'];

export const WITHDRAWAL_STATUSES = ['pending', 'processing', 'completed', 'rejected'];

export const NOTIFICATION_TYPES = [
  'booking_confirmed', 'booking_cancelled', 'event_reminder',
  'payment_received', 'review_received', 'system', 'goal_missed',
  'session_booked', 'new_message',
];

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
};
