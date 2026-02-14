import jwt from 'jsonwebtoken';
import { JWT_CONFIG } from '../config/constants.js';

export const generateAccessToken = (payload) => {
  return jwt.sign(payload, JWT_CONFIG.ACCESS_TOKEN_SECRET, {
    expiresIn: JWT_CONFIG.ACCESS_TOKEN_EXPIRY,
  });
};

export const generateRefreshToken = (payload) => {
  return jwt.sign(payload, JWT_CONFIG.REFRESH_TOKEN_SECRET, {
    expiresIn: JWT_CONFIG.REFRESH_TOKEN_EXPIRY,
  });
};

export const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, JWT_CONFIG.ACCESS_TOKEN_SECRET);
  } catch (error) {
    throw new Error('Invalid or expired access token');
  }
};

export const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, JWT_CONFIG.REFRESH_TOKEN_SECRET);
  } catch (error) {
    throw new Error('Invalid or expired refresh token');
  }
};
