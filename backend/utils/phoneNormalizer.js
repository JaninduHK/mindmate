// utils/phoneNormalizer.js
/**
 * Normalize and validate phone numbers
 * Supports E.164 format and common local formats
 * Focus: Sri Lankan phone numbers
 */

const SRI_LANKA_COUNTRY_CODE = '+94';
const SRI_LANKA_PREFIX = '94';

/**
 * Normalize phone number to E.164 format
 * Handles Sri Lankan local formats and E.164
 * @param {string} phoneNumber - Raw phone number
 * @returns {string|null} Normalized E.164 format or null if invalid
 */
export const normalizePhoneNumber = (phoneNumber) => {
  if (!phoneNumber) return null;

  // Remove all non-digit characters except +
  let cleaned = phoneNumber.replace(/[^\d+]/g, '');

  // Remove leading + if present
  const hasPlus = cleaned.startsWith('+');
  cleaned = cleaned.replace(/^\+/, '');

  // Handle Sri Lankan local formats
  if (cleaned.startsWith('0')) {
    // Local format: 0701234567 -> +94701234567
    cleaned = SRI_LANKA_PREFIX + cleaned.substring(1);
  } else if (cleaned.startsWith('94')) {
    // Already has country code: 94701234567 -> +94701234567
    // No change needed after adding + below
  } else if (cleaned.length === 9) {
    // Assume local without country code: 701234567 -> +94701234567
    cleaned = SRI_LANKA_PREFIX + cleaned;
  }

  // Validate length (E.164: +<1-15 digits>)
  if (cleaned.length < 2 || cleaned.length > 15) {
    return null;
  }

  // Validate Sri Lanka format specifically
  if (cleaned.startsWith(SRI_LANKA_PREFIX)) {
    if (cleaned.length !== 12) {
      // Sri Lanka: 94 + 10 digits
      return null;
    }
  }

  return `+${cleaned}`;
};

/**
 * Validate E.164 formatted phone number
 * @param {string} phoneNumber - E.164 formatted phone number
 * @returns {boolean}
 */
export const isValidPhoneNumber = (phoneNumber) => {
  if (!phoneNumber) return false;
  const normalized = normalizePhoneNumber(phoneNumber);
  return normalized !== null;
};

/**
 * Extract country code from phone number
 * @param {string} phoneNumber - E.164 formatted phone number
 * @returns {string|null} Country code e.g. "94" or null
 */
export const extractCountryCode = (phoneNumber) => {
  const normalized = normalizePhoneNumber(phoneNumber);
  if (!normalized) return null;
  
  const match = normalized.match(/^\+(\d{1,3})/);
  return match ? match[1] : null;
};

/**
 * Get phone display format for SMS (for readability)
 * @param {string} phoneNumber - E.164 formatted phone number
 * @returns {string} Masked phone number for display
 */
export const maskPhoneNumber = (phoneNumber) => {
  if (!phoneNumber || phoneNumber.length < 4) return '***';
  const cleaned = phoneNumber.replace(/\D/g, '');
  const lastFour = cleaned.slice(-4);
  return `****${lastFour}`;
};
