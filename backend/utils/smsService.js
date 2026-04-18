// utils/smsService.js
/**
 * SMS Service using Twilio
 * Falls back to console logging if credentials not available
 */

let twilio = null;
let twilioClient = null;

// Initialize Twilio client if credentials are available
const getTwilioClient = () => {
  if (twilioClient) return twilioClient;

  try {
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      twilio = require('twilio');
      twilioClient = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      );
      console.log('[SMS] Twilio client initialized');
      return twilioClient;
    }
  } catch (error) {
    console.warn('[SMS] Twilio not installed or credentials missing, using mock SMS');
  }

  return null;
};

/**
 * Send SMS message
 * @param {string} phoneNumber - Recipient phone number (E.164 format: +1234567890)
 * @param {string} body - SMS message body
 * @returns {Promise<Object>} - Result object with status and messageId
 */
export const sendSMS = async (phoneNumber, body) => {
  try {
    // Validate phone number
    if (!phoneNumber || phoneNumber.trim() === '') {
      console.log('[SMS] Phone number not provided, skipping SMS');
      return {
        success: false,
        error: 'Phone number not provided',
      };
    }

    const client = getTwilioClient();

    // If Twilio is not configured, mock the SMS
    if (!client) {
      console.log('[SMS_MOCK] Would send SMS to:', phoneNumber);
      console.log('[SMS_MOCK] Message:', body);
      return {
        success: true,
        messageId: `mock-${Date.now()}`,
        message: 'SMS would be sent in production (Twilio not configured)',
      };
    }

    // Send SMS via Twilio
    const message = await client.messages.create({
      body: body,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phoneNumber,
    });

    console.log(`[SMS] Sent to ${phoneNumber}. SID: ${message.sid}`);
    return {
      success: true,
      messageId: message.sid,
      status: message.status,
    };
  } catch (error) {
    console.error('[SMS] Error sending SMS:', {
      phoneNumber,
      error: error.message,
    });

    // Return failure but don't throw - SMS failure shouldn't break the flow
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Send bulk SMS messages
 * @param {Array<Object>} recipients - Array of {phoneNumber, body}
 * @returns {Promise<Array>} - Array of results
 */
export const sendBulkSMS = async (recipients) => {
  const results = [];

  for (const { phoneNumber, body } of recipients) {
    const result = await sendSMS(phoneNumber, body);
    results.push({
      phoneNumber,
      ...result,
    });
  }

  return results;
};

/**
 * Verify phone number format (basic E.164 validation)
 * @param {string} phoneNumber - Phone number to verify
 * @returns {boolean}
 */
export const isValidPhoneNumber = (phoneNumber) => {
  if (!phoneNumber) return false;
  // Basic E.164 format: +1234567890 (+ followed by 10-15 digits)
  const e164Regex = /^\+?[1-9]\d{9,14}$/;
  return e164Regex.test(phoneNumber.replace(/\s/g, ''));
};

/**
 * Normalize phone number to E.164 format
 * @param {string} phoneNumber - Raw phone number
 * @param {string} countryCode - Country code (default: +1 for US)
 * @returns {string} - E.164 formatted phone number
 */
export const normalizePhoneNumber = (phoneNumber, countryCode = '+1') => {
  if (!phoneNumber) return '';

  // Remove all non-digit characters
  const digits = phoneNumber.replace(/\D/g, '');

  // If already has country code at start, use as-is
  if (phoneNumber.startsWith('+')) {
    return '+' + digits;
  }

  // If 10 digits (US/Canada), add +1
  if (digits.length === 10) {
    return '+1' + digits;
  }

  // If 11 digits starting with 1, it's US with leading 1
  if (digits.length === 11 && digits.startsWith('1')) {
    return '+' + digits;
  }

  // Otherwise, assume it's missing country code
  if (digits.length >= 10) {
    return countryCode + digits;
  }

  // Return as-is if can't parse
  return phoneNumber;
};
