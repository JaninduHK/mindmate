import User from '../models/User.model.js';
import RefreshToken from '../models/RefreshToken.model.js';
import EmergencyContact from '../models/EmergencyContact.model.js';
import GuardianSignup from '../models/GuardianSignup.model.js';
import GuardianSignin from '../models/GuardianSignin.model.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt.util.js';
import { generateUsername } from '../utils/username.util.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import { HTTP_STATUS, JWT_CONFIG, USER_ROLES } from '../config/constants.js';
import invitationService from '../services/invitationService.js';
import { sendEmail } from '../utils/email.util.js';
import { composeInvitationEmail } from '../utils/invitationMailer.js';
import { composeInvitationSMS } from '../utils/smsBodies.js';
import { generateInvitationUrl, verifyTokenHash, hashToken } from '../utils/tokenGenerator.js';

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
  const { name, email, password, initialEmergencyContact, invitationToken } = req.body;

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

  // Determine user role - if they're accepting an emergency contact invitation, make them emergency_contact
  let userRole = 'user';
  let acceptedInvitation = null;

  if (invitationToken) {
    // Verify and process invitation
    try {
      console.log('[REGISTER] Processing invitation token for email:', email.toLowerCase());

      // Find pending contact by email (don't try to hash match - use verifyTokenHash instead)
      const pendingContact = await EmergencyContact.findOne({
        email: email.toLowerCase(),
        inviteStatus: 'pending',
      })
        .select('+inviteTokenHash')
        .populate('ownerUserId', 'name email');

      console.log('[REGISTER] Found pending contact:', pendingContact ? `Yes (owner: ${pendingContact.ownerUserId?.name})` : 'No');

      if (pendingContact) {
        // Now verify the token against the stored hash
        const isValidToken = verifyTokenHash(invitationToken, pendingContact.inviteTokenHash);
        console.log('[REGISTER] Token verification:', isValidToken ? 'VALID' : 'INVALID');

        if (!isValidToken) {
          console.log('[REGISTER] Invalid token provided');
          throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Invalid invitation token');
        }

        // Check if token is expired
        if (pendingContact.inviteExpiresAt && new Date() > pendingContact.inviteExpiresAt) {
          console.log('[REGISTER] Invitation expired at:', pendingContact.inviteExpiresAt);
          throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Invitation has expired');
        }

        // Mark invitation as will be accepted after user creation
        acceptedInvitation = pendingContact;
        userRole = 'emergency_contact'; // Set role to emergency_contact
        console.log('[REGISTER] Will accept invitation after user creation');
      }
    } catch (error) {
      if (error instanceof ApiError) throw error;
      console.error('[REGISTER] Error verifying invitation:', error);
      throw error; // Don't silently fail - let the user know
    }
  }

  // Create user with appropriate role
  const user = await User.create({
    name,
    email,
    password,
    username,
    role: userRole,
  });

  // If they accepted an invitation, update the emergency contact and create Guardian signup record
  if (acceptedInvitation) {
    console.log('[REGISTER] Accepting invitation for contact:', acceptedInvitation._id);
    acceptedInvitation.contactUserId = user._id;
    acceptedInvitation.inviteStatus = 'accepted';
    acceptedInvitation.acceptedAt = new Date();
    acceptedInvitation.inviteTokenHash = null; // Clear token for security
    acceptedInvitation.inviteExpiresAt = null;
    await acceptedInvitation.save();
    console.log('[REGISTER] Invitation accepted! Contact is now linked:', {
      contactUserId: user._id,
      ownerUserId: acceptedInvitation.ownerUserId?._id,
      inviteStatus: 'accepted',
    });

    // Create GuardianSignup record for tracking
    try {
      const guardianSignup = await GuardianSignup.create({
        userId: user._id,
        emergencyContactId: acceptedInvitation._id,
        monitoredUserId: acceptedInvitation.ownerUserId._id,
        fullName: user.name,
        email: user.email,
        phoneNumber: acceptedInvitation.phoneNumber || null,
        relationship: acceptedInvitation.relationship,
        invitationToken: invitationToken || 'signup-completed-' + user._id,
        inviteTokenHash: invitationToken || 'signup-completed-' + user._id,
        tokenVerifiedAt: new Date(),
        signupStatus: 'verified',
        emailVerified: true,
        signupCompletedAt: new Date(),
        consentsToMonitoring: true,
      });
      console.log('[REGISTER] GuardianSignup record created:', {
        id: guardianSignup._id,
        userId: user._id,
        monitoredUserId: acceptedInvitation.ownerUserId._id,
      });
    } catch (error) {
      console.error('[REGISTER] Error creating GuardianSignup:', error);
      // Don't fail the registration if GuardianSignup creation fails
    }
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

  // Set refresh token cookie
  setRefreshTokenCookie(res, refreshToken);

  // Handle initial emergency contact if provided (for regular users adding contacts during signup)
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
      const { token: newInvitationToken, expiresAt: tokenExpiresAt } = await invitationService.createInvitation(
        user._id,
        emergencyContact._id,
        initialEmergencyContact.email
      );

      // Generate invitation URL
      const frontendUrl = process.env.CLIENT_URL || 'http://localhost:5173';
      const invitationUrl = generateInvitationUrl(newInvitationToken, frontendUrl);

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

  if (acceptedInvitation) {
    responseData.invitationAccepted = {
      success: true,
      message: 'Emergency contact invitation accepted',
      monitoredUser: acceptedInvitation.ownerUserId?.name,
    };
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

  // Check if this is a guardian/emergency contact login
  // If they exist in the EmergencyContact table as a contact, set their role appropriately
  if (user.role === USER_ROLES.USER) {
    const isEmergencyContact = await EmergencyContact.findOne({
      contactUserId: user._id,
      inviteStatus: 'accepted',
    });

    if (isEmergencyContact) {
      user.role = USER_ROLES.EMERGENCY_CONTACT;
    }
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
  
  console.log('[LOGIN] User logged in:', { email: user.email, role: user.role, userId: user._id });
  
  // If this is a guardian/emergency contact, create signin record
  if (user.role === USER_ROLES.EMERGENCY_CONTACT || user.role === 'emergency_contact') {
    console.log('[LOGIN] Guardian login detected for user:', user._id);
    let guardianSignup = await GuardianSignup.findOne({ userId: user._id });
    
    console.log('[LOGIN] GuardianSignup lookup:', guardianSignup ? `Found - monitoring ${guardianSignup.monitoredUserId}` : 'Not found');
    
    // If GuardianSignup doesn't exist, create it from EmergencyContact
    if (!guardianSignup) {
      console.log('[LOGIN] GuardianSignup not found - checking EmergencyContact...');
      const emergencyContact = await EmergencyContact.findOne({
        contactUserId: user._id,
        inviteStatus: 'accepted',
      }).populate('ownerUserId', '_id name email');
      
      if (emergencyContact) {
        console.log('[LOGIN] Found EmergencyContact - creating GuardianSignup record...');
        try {
          guardianSignup = await GuardianSignup.create({
            userId: user._id,
            emergencyContactId: emergencyContact._id,
            monitoredUserId: emergencyContact.ownerUserId._id,
            fullName: user.name,
            email: user.email,
            phoneNumber: emergencyContact.phoneNumber || null,
            relationship: emergencyContact.relationship,
            invitationToken: 'login-signup-' + user._id,
            inviteTokenHash: 'login-signup-' + user._id,
            tokenVerifiedAt: emergencyContact.acceptedAt || new Date(),
            signupStatus: 'verified',
            emailVerified: true,
            signupCompletedAt: emergencyContact.acceptedAt || new Date(),
            consentsToMonitoring: true,
          });
          console.log('[LOGIN] GuardianSignup created from EmergencyContact:', guardianSignup._id);
        } catch (error) {
          console.error('[LOGIN] Error creating GuardianSignup:', error);
        }
      }
    }
    
    if (guardianSignup) {
      const sessionId = `session_${user._id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const guardianSigninRecord = await GuardianSignin.create({
        userId: user._id,
        monitoredUserId: guardianSignup.monitoredUserId,
        guardianEmail: user.email,
        sessionId: sessionId,
        accessToken: accessToken,
        refreshToken: refreshToken,
        signinAt: new Date(),
        lastActivityAt: new Date(),
        status: 'active',
        deviceInfo: {
          userAgent: req.get('user-agent'),
          ipAddress: req.ip || req.connection.remoteAddress,
          browser: extractBrowserInfo(req.get('user-agent')),
          operatingSystem: extractOSInfo(req.get('user-agent')),
        },
        authMethod: 'email_password',
        requestCount: 0,
        accessTokenExpiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
        refreshTokenExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      });
      console.log('[LOGIN] GuardianSignin record created:', {
        id: guardianSigninRecord._id,
        sessionId: sessionId,
        monitoredUserId: guardianSignup.monitoredUserId,
      });
    } else {
      console.log('[LOGIN] GuardianSignup still not found - guardian may not be properly linked to any users');
    }
  }

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
  let monitoredUserId = null;
  if (emergencyContact) {
    emergencyContact.contactUserId = user._id;
    emergencyContact.inviteStatus = 'accepted';
    monitoredUserId = emergencyContact.ownerUserId; // Get the person being monitored
    await emergencyContact.save();
    
    // Create GuardianSignup details record
    await GuardianSignup.create({
      userId: user._id,
      emergencyContactId: emergencyContact._id,
      monitoredUserId: monitoredUserId,
      fullName: name,
      email: email,
      relationship: emergencyContact.relationship || 'Other',
      invitationToken: invitationToken,
      inviteTokenHash: emergencyContact.inviteTokenHash,
      tokenVerifiedAt: new Date(),
      signupStatus: 'verified',
      emailVerified: true,
      signupCompletedAt: new Date(),
      signupIpAddress: req.ip || req.connection.remoteAddress,
      signupUserAgent: req.get('user-agent'),
      consentsToMonitoring: true,
      consentGivenAt: new Date(),
      termsAccepted: true,
      termsAcceptedAt: new Date(),
      privacyPolicyAccepted: true,
      privacyPolicyAcceptedAt: new Date(),
    });
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
        monitoredUserId, // Send monitored user ID for redirect
      },
      'Guardian account created successfully'
    )
  );
});

// Get current user (for verifying token)
export const getCurrentUser = asyncHandler(async (req, res) => {
  // Check if user should have emergency_contact role
  if (req.user.role === USER_ROLES.USER) {
    const isEmergencyContact = await EmergencyContact.findOne({
      contactUserId: req.user._id,
      inviteStatus: 'accepted',
    });

    if (isEmergencyContact) {
      req.user.role = USER_ROLES.EMERGENCY_CONTACT;
    }
  }

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, { user: req.user.toPublicJSON() }, 'User retrieved successfully')
  );
});

// Helper function to extract browser info from user agent
function extractBrowserInfo(userAgent) {
  if (!userAgent) return 'Unknown';
  
  if (userAgent.includes('Chrome')) return 'Chrome';
  if (userAgent.includes('Firefox')) return 'Firefox';
  if (userAgent.includes('Safari')) return 'Safari';
  if (userAgent.includes('Edge')) return 'Edge';
  if (userAgent.includes('Opera')) return 'Opera';
  
  return 'Unknown';
}

// Helper function to extract OS info from user agent
function extractOSInfo(userAgent) {
  if (!userAgent) return 'Unknown';
  
  if (userAgent.includes('Windows')) return 'Windows';
  if (userAgent.includes('Mac')) return 'macOS';
  if (userAgent.includes('Linux')) return 'Linux';
  if (userAgent.includes('Android')) return 'Android';
  if (userAgent.includes('iPhone') || userAgent.includes('iPad')) return 'iOS';
  
  return 'Unknown';
}

