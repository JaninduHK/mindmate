import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY_HEX = () => process.env.HEALTH_DATA_ENCRYPTION_KEY || '';

const getKey = () => {
  const hex = KEY_HEX();
  if (!hex || hex.length !== 64) {
    throw new Error('HEALTH_DATA_ENCRYPTION_KEY must be a 64-char hex string (32 bytes)');
  }
  return Buffer.from(hex, 'hex');
};

/**
 * Encrypts plaintext using AES-256-GCM.
 * Returns "iv:authTag:ciphertext" as hex-encoded string.
 */
export const encrypt = (plaintext) => {
  if (!plaintext) return '';
  const key = getKey();
  const iv = crypto.randomBytes(12); // 96-bit IV for GCM
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
};

/**
 * Decrypts an "iv:authTag:ciphertext" hex string.
 * Returns the original plaintext.
 */
export const decrypt = (stored) => {
  if (!stored) return '';
  const key = getKey();
  const [ivHex, authTagHex, encryptedHex] = stored.split(':');
  if (!ivHex || !authTagHex || !encryptedHex) return '';
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const encrypted = Buffer.from(encryptedHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
};
