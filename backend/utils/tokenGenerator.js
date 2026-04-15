// utils/tokenGenerator.js
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

/**
 * Generate a secure random token for invitation links
 * @returns {string} Raw token (to be sent in email)
 */
export const generateInvitationToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Hash a token for storage in database
 * @param {string} token - Raw token
 * @returns {string} Hashed token
 */
export const hashToken = (token) => {
  return bcrypt.hashSync(token, 10);
};

/**
 * Verify a token against its hash
 * @param {string} token - Raw token
 * @param {string} hash - Hashed token from database
 * @returns {boolean}
 */
export const verifyTokenHash = (token, hash) => {
  return bcrypt.compareSync(token, hash);
};

/**
 * Generate invitation URL for email/SMS
 * @param {string} token - Raw token
 * @param {string} baseUrl - Frontend base URL
 * @param {string} invitationType - 'new-account' or 'existing-account'
 * @returns {string} Full invitation URL
 */
export const generateInvitationUrl = (token, baseUrl, invitationType = 'new-account') => {
  const path = invitationType === 'existing-account' 
    ? `/accept-emergency-invitation`
    : `/guardian-signup`;
  
  return `${baseUrl}${path}?token=${token}`;
};
