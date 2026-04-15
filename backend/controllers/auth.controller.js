import User from '../models/User.model.js';
import RefreshToken from '../models/RefreshToken.model.js';
import EmergencyContact from '../models/EmergencyContact.model.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt.util.js';
import { generateUsername } from '../utils/username.util.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import { HTTP_STATUS, JWT_CONFIG } from '../config/constants.js';
import invitationService from '../services/invitationService.js';
import { sendEmail } from '../utils/email.util.js';
import { composeInvitationEmail } from '../utils/invitationMailer.js';
import { composeInvitationSMS } from '../utils/smsBodies.js';
import { generateInvitationUrl, verifyTokenHash } from '../utils/tokenGenerator.js';

// Helper function to set refresh token cookie
const setRefreshTokenCookie = (res, token) => {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

// Register new user
export const register = asyncHandler(async (req, res) => {
  const { name, email, password, initialEmergencyContact } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(HTTP_STATUS.CONFLICT, 'Email already registered');
  }

  // Generate a unique friendly username (retry on collision)
  let username;
  for (let i = 0; i < 5; i++) {
    const candidate = generateUsername();
    const exists = await User.findOne({ username: candidate }).select('_id');
    if (!exists) { username = candidate; break; }
  }
  if (!username) username = generateUsername(); // fallback — collision is extremely rare

  // Create user
  const user = await User.create({
    name,
    email,
    password,
    username,
  });

  // Generate tokens
  const accessToken = generateAccessToken({ userId: user._id });
  const refreshToken = generateRefreshToken({ userId: user._id });

  // Save refresh token to database
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  await RefreshToken.create({
    userId: user._id,
    token: refreshToken,
    expiresAt,
    createdByIp: req.ip,
  });

  // Set refresh token cookie
  setRefreshTokenCookie(res, refreshToken);

  // Handle initial emergency contact if provided
  let invitationStatus = null;
  if (initialEmergencyContact && initialEmergencyContact.fullName) {
    try {
      // Create emergency contact
      const emergencyContact = await EmergencyContact.create({
        ownerUserId: user._id,
        fullName: initialEmergencyContact.fullName,
        email: initialEmergencyContact.email,
        phoneNumber: initialEmergencyContact.phoneNumber,
        relationship: initialEmergencyContact.relationship,
        inviteStatus: 'pending',
      });

      // Create invitation
      const { token: invitationToken, expiresAt: tokenExpiresAt } = await invitationService.createInvitation(
        user._id,
        emergencyContact._id,
        initialEmergencyContact.email
      );

      // Generate invitation URL
      const frontendUrl = process.env.CLIENT_URL || 'http://localhost:5173';
      const invitationUrl = generateInvitationUrl(invitationToken, frontendUrl);

      // Compose and send email
      const emailContent = composeInvitationEmail(
        initialEmergencyContact.fullName,
        user.name,
        invitationUrl,
        initialEmergencyContact.relationship
      );

      await sendEmail({
        to: initialEmergencyContact.email,
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text,
      });

      // Compose and send SMS (if SMS service is available)
      const smsContent = composeInvitationSMS(user.name, invitationUrl);
      console.log(`[SMS] Would send to ${initialEmergencyContact.phoneNumber}: ${smsContent.body}`);
      // TODO: Integrate actual SMS service (Twilio, etc.) when available

      invitationStatus = {
        success: true,
        message: 'Invitation sent successfully via email and SMS',
        expiresAt: tokenExpiresAt,
      };
    } catch (error) {
      console.error('Error creating emergency contact invitation:', error);
      // Don't fail the registration if invitation fails
      invitationStatus = {
        success: false,
        message: `Failed to send invitation: ${error.message}`,
      };
    }
  }

  const responseData = {
    user: user.toPublicJSON(),
    accessToken,
  };

  if (invitationStatus) {
    responseData.invitationStatus = invitationStatus;
  }

  res.status(HTTP_STATUS.CREATED).json(
    new ApiResponse(
      HTTP_STATUS.CREATED,
      responseData,
      'User registered successfully'
    )
  );
});

// Login user
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Find user with password field
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Invalid email or password');
  }

  // Check if user is active
  if (!user.isActive) {
    throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Your account has been deactivated');
  }

  // Verify password
  const isPasswordValid = await user.comparePassword(password);

  if (!isPasswordValid) {
    throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Invalid email or password');
  }

  // Generate tokens
  const accessToken = generateAccessToken({ userId: user._id });
  const refreshToken = generateRefreshToken({ userId: user._id });

  // Save refresh token to database
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  await RefreshToken.create({
    userId: user._id,
    token: refreshToken,
    expiresAt,
    createdByIp: req.ip,
  });

  // Update last login
  user.lastLogin = new Date();
  await user.save();

  // Set refresh token cookie
  setRefreshTokenCookie(res, refreshToken);

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(
      HTTP_STATUS.OK,
      {
        user: user.toPublicJSON(),
        accessToken,
      },
      'Login successful'
    )
  );
});

// Refresh access token
export const refreshAccessToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.cookies;

  if (!refreshToken) {
    throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Refresh token is required');
  }

  // Verify refresh token
  let decoded;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch (error) {
    throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Invalid or expired refresh token');
  }

  // Find refresh token in database
  const storedToken = await RefreshToken.findOne({ token: refreshToken, userId: decoded.userId });

  if (!storedToken || !storedToken.isActive()) {
    throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Refresh token is invalid or has been revoked');
  }

  // Find user
  const user = await User.findById(decoded.userId);

  if (!user || !user.isActive) {
    throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'User not found or inactive');
  }

  // Generate new tokens
  const newAccessToken = generateAccessToken({ userId: user._id });
  const newRefreshToken = generateRefreshToken({ userId: user._id });

  try {
    // Revoke old refresh token FIRST to avoid conflicts
    storedToken.revokedAt = new Date();
    storedToken.revokedByIp = req.ip;
    storedToken.replacedByToken = newRefreshToken;
    await storedToken.save();

    // Then save new refresh token
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await RefreshToken.create({
      userId: user._id,
      token: newRefreshToken,
      expiresAt,
      createdByIp: req.ip,
    });
  } catch (dbError) {
    console.error('Error managing refresh tokens:', dbError);
    throw new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Failed to refresh token');
  }

  // Set new refresh token cookie
  setRefreshTokenCookie(res, newRefreshToken);

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(
      HTTP_STATUS.OK,
      {
        accessToken: newAccessToken,
      },
      'Token refreshed successfully'
    )
  );
});

// Logout user
export const logout = asyncHandler(async (req, res) => {
  const { refreshToken } = req.cookies;

  // If peer supporter is logging out, set them as offline
  if (req.user && req.user.role === 'peer_supporter') {
    await User.findByIdAndUpdate(req.user._id, {
      isAvailableNow: false,
      lastAvailableToggle: new Date(),
    });
  }

  if (refreshToken) {
    // Revoke refresh token
    const storedToken = await RefreshToken.findOne({ token: refreshToken });

    if (storedToken) {
      storedToken.revokedAt = new Date();
      storedToken.revokedByIp = req.ip;
      await storedToken.save();
    }
  }

  // Clear cookie
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });

  res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, null, 'Logout successful'));
});

// Register peer supporter
export const registerPeerSupporter = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(HTTP_STATUS.CONFLICT, 'Email already registered');
  }

  let username;
  for (let i = 0; i < 5; i++) {
    const candidate = generateUsername();
    const exists = await User.findOne({ username: candidate }).select('_id');
    if (!exists) { username = candidate; break; }
  }
  if (!username) username = generateUsername();

  const user = await User.create({
    name,
    email,
    password,
    username,
    role: 'peer_supporter',
  });

  const accessToken = generateAccessToken({ userId: user._id });
  const refreshToken = generateRefreshToken({ userId: user._id });

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await RefreshToken.create({
    userId: user._id,
    token: refreshToken,
    expiresAt,
    createdByIp: req.ip,
  });

  setRefreshTokenCookie(res, refreshToken);

  res.status(HTTP_STATUS.CREATED).json(
    new ApiResponse(
      HTTP_STATUS.CREATED,
      { user: user.toPublicJSON(), accessToken },
      'Peer supporter registered successfully'
    )
  );
});

// Register as guardian/emergency contact using invitation token (optional)
export const guardianSignup = asyncHandler(async (req, res) => {
  const { name, email, password, invitationToken } = req.body;

  // Validate required fields
  if (!name || !email || !password) {
    throw new ApiError(
      HTTP_STATUS.BAD_REQUEST,
      'Name, email, and password are required'
    );
  }

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(HTTP_STATUS.CONFLICT, 'Email already registered');
  }

  // If invitation token is provided, verify it
  let emergencyContact = null;
  if (invitationToken) {
    // Find the emergency contact invitation record
    emergencyContact = await EmergencyContact.findOne({
      email,
      inviteStatus: 'pending',
    }).select('+inviteTokenHash inviteExpiresAt');

    if (!emergencyContact) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        'Invalid or expired invitation. Please contact the person who invited you.'
      );
    }

    // Verify the token hash
    const isTokenValid = verifyTokenHash(invitationToken, emergencyContact.inviteTokenHash);
    if (!isTokenValid) {
      throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Invalid invitation token');
    }

    // Check if token has expired
    if (emergencyContact.inviteExpiresAt && new Date() > emergencyContact.inviteExpiresAt) {
      throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Invitation token has expired');
    }
  }

  // Generate a unique friendly username
  let username;
  for (let i = 0; i < 5; i++) {
    const candidate = generateUsername();
    const exists = await User.findOne({ username: candidate }).select('_id');
    if (!exists) {
      username = candidate;
      break;
    }
  }
  if (!username) username = generateUsername();

  // Create the new user as emergency_contact
  const user = await User.create({
    name,
    email,
    password,
    username,
    role: 'emergency_contact',
  });

  // If this is from an invitation, link the emergency contact record
  if (emergencyContact) {
    emergencyContact.contactUserId = user._id;
    emergencyContact.inviteStatus = 'accepted';
    emergencyContact.inviteTokenHash = null; // Clear the token after use
    await emergencyContact.save();
  }

  // Generate tokens
  const accessToken = generateAccessToken({ userId: user._id });
  const refreshToken = generateRefreshToken({ userId: user._id });

  // Store refresh token
  await RefreshToken.create({
    userId: user._id,
    token: refreshToken,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  // Set refresh token cookie
  setRefreshTokenCookie(res, refreshToken);

  res.status(HTTP_STATUS.CREATED).json(
    new ApiResponse(
      HTTP_STATUS.CREATED,
      {
        user: user.toPublicJSON(),
        accessToken,
      },
      'Guardian account created successfully'
    )
  );
});

// Get current user (for verifying token)
export const getCurrentUser = asyncHandler(async (req, res) => {
  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, { user: req.user.toPublicJSON() }, 'User retrieved successfully')
  );
});
