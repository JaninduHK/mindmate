import EmergencyContact from '../models/EmergencyContact.model.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import { HTTP_STATUS } from '../config/constants.js';
import { generateInvitationToken, hashToken } from '../utils/tokenGenerator.js';
import { sendEmail } from '../utils/email.util.js';
import { sendSMS, normalizePhoneNumber } from '../utils/smsService.js';
import { composeInvitationEmail } from '../utils/invitationMailer.js';
import { composeInvitationSMS } from '../utils/smsBodies.js';
import { generateInvitationUrl } from '../utils/tokenGenerator.js';

// Get all emergency contacts for current user
export const getEmergencyContacts = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const contacts = await EmergencyContact.find({ ownerUserId: userId })
    .populate('contactUserId', 'name email')
    .sort({ createdAt: -1 });

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(
      HTTP_STATUS.OK,
      { data: contacts },
      'Emergency contacts retrieved successfully'
    )
  );
});

// Get single emergency contact
export const getEmergencyContact = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  const contact = await EmergencyContact.findOne({
    _id: id,
    ownerUserId: userId,
  }).populate('contactUserId', 'name email');

  if (!contact) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Emergency contact not found');
  }

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(
      HTTP_STATUS.OK,
      { data: contact },
      'Emergency contact retrieved successfully'
    )
  );
});

// Add new emergency contact
export const addEmergencyContact = asyncHandler(async (req, res) => {
  const { fullName, email, phoneNumber, relationship } = req.body;
  const userId = req.user._id;

  // Validate input
  if (!fullName || !email || !relationship) {
    throw new ApiError(
      HTTP_STATUS.BAD_REQUEST,
      'Full name, email, and relationship are required'
    );
  }

  // Check if contact already exists for this user
  const existingContact = await EmergencyContact.findOne({
    ownerUserId: userId,
    email: email.toLowerCase(),
  });

  if (existingContact) {
    throw new ApiError(
      HTTP_STATUS.CONFLICT,
      'This email is already added as an emergency contact'
    );
  }

  // Generate invitation token and hash
  const invitationToken = generateInvitationToken();
  const tokenHash = hashToken(invitationToken);
  const tokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  console.log('[ADD_CONTACT] Creating new emergency contact invitation:', {
    ownerUserId: userId,
    email: email.toLowerCase(),
    fullName,
  });

  // Create emergency contact record
  const contact = await EmergencyContact.create({
    ownerUserId: userId,
    fullName,
    email: email.toLowerCase(),
    phoneNumber,
    relationship,
    inviteStatus: 'pending',
    inviteTokenHash: tokenHash,
    inviteExpiresAt: tokenExpiresAt,
    lastInvitedAt: new Date(),
  });

  console.log('[ADD_CONTACT] Contact created:', {
    id: contact._id,
    inviteStatus: contact.inviteStatus,
    email: contact.email,
  });

  // Get user name for email
  const user = await req.user.constructor.findById(userId).select('name');

  // Generate invitation URL
  const frontendUrl = process.env.CLIENT_URL || 'http://localhost:3000';
  const invitationUrl = generateInvitationUrl(invitationToken, frontendUrl);

  try {
    // Send invitation email
    const emailContent = composeInvitationEmail(
      fullName,
      user.name,
      invitationUrl,
      relationship
    );

    await sendEmail({
      to: email,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
    });

    console.log(`[INVITATION] Email sent to ${email}`);

    // Send invitation SMS
    if (phoneNumber && phoneNumber.trim()) {
      const normalizedPhone = normalizePhoneNumber(phoneNumber);
      const smsContent = composeInvitationSMS(user.name, invitationUrl);
      
      const smsResult = await sendSMS(normalizedPhone, smsContent.body);
      console.log(`[INVITATION] SMS result for ${normalizedPhone}:`, smsResult);
    } else {
      console.log(`[INVITATION] No phone number provided for SMS`);
    }

    // Update delivery status
    contact.deliveryStatus.email = 'sent';
    if (phoneNumber) contact.deliveryStatus.sms = 'sent';
    await contact.save();

    console.log(`[INVITATION] Contact record updated with delivery status`);
  } catch (error) {
    console.error('Error sending invitation:', error);
    // Continue anyway - contact is created, just email/SMS failed
  }

  res.status(HTTP_STATUS.CREATED).json(
    new ApiResponse(
      HTTP_STATUS.CREATED,
      { data: contact },
      'Emergency contact added and invitation sent'
    )
  );
});

// Update emergency contact
export const updateEmergencyContact = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { fullName, phoneNumber, relationship, email } = req.body;
  const userId = req.user._id;

  const contact = await EmergencyContact.findOne({
    _id: id,
    ownerUserId: userId,
  });

  if (!contact) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Emergency contact not found');
  }

  // Only allow updating these fields
  if (fullName) contact.fullName = fullName;
  if (phoneNumber !== undefined) contact.phoneNumber = phoneNumber;
  if (relationship) contact.relationship = relationship;
  if (email) contact.email = email.toLowerCase();

  await contact.save();

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(
      HTTP_STATUS.OK,
      { data: contact },
      'Emergency contact updated successfully'
    )
  );
});

// Delete emergency contact
export const deleteEmergencyContact = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  const contact = await EmergencyContact.findOneAndDelete({
    _id: id,
    ownerUserId: userId,
  });

  if (!contact) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Emergency contact not found');
  }

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(
      HTTP_STATUS.OK,
      {},
      'Emergency contact deleted successfully'
    )
  );
});

// Resend invitation to emergency contact
export const resendEmergencyInvite = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  const contact = await EmergencyContact.findOne({
    _id: id,
    ownerUserId: userId,
  }).select('+inviteTokenHash');

  if (!contact) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Emergency contact not found');
  }

  // Generate new token if expired
  let invitationToken = contact.inviteTokenHash;
  if (!invitationToken || (contact.inviteExpiresAt && new Date() > contact.inviteExpiresAt)) {
    invitationToken = generateInvitationToken();
    contact.inviteTokenHash = hashToken(invitationToken);
    contact.inviteExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  }

  contact.lastInvitedAt = new Date();
  await contact.save();

  // Resend email
  const user = await req.user.constructor.findById(userId).select('name');
  const frontendUrl = process.env.CLIENT_URL || 'http://localhost:3000';
  const invitationUrl = generateInvitationUrl(invitationToken, frontendUrl);

  try {
    const emailContent = composeInvitationEmail(
      contact.fullName,
      user.name,
      invitationUrl,
      contact.relationship
    );

    await sendEmail({
      to: contact.email,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
    });

    console.log(`[RESEND_INVITE] Email resent to ${contact.email}`);

    // Resend SMS
    if (contact.phoneNumber && contact.phoneNumber.trim()) {
      const normalizedPhone = normalizePhoneNumber(contact.phoneNumber);
      const smsContent = composeInvitationSMS(user.name, invitationUrl);
      
      const smsResult = await sendSMS(normalizedPhone, smsContent.body);
      console.log(`[RESEND_INVITE] SMS result for ${normalizedPhone}:`, smsResult);
    }

    contact.deliveryStatus.email = 'sent';
    if (contact.phoneNumber) contact.deliveryStatus.sms = 'sent';
    await contact.save();

    console.log(`[RESEND_INVITE] Contact record updated with delivery status`);
  } catch (error) {
    console.error('Error resending invitation:', error);
    throw new ApiError(
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to resend invitation'
    );
  }

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(
      HTTP_STATUS.OK,
      { data: contact },
      'Invitation resent successfully'
    )
  );
});

// Get all monitored users for a guardian (emergency_contact)
export const getMonitoredUsers = asyncHandler(async (req, res) => {
  const guardianId = req.user._id;

  // Find all emergency contacts where this user is the contactUserId (accepted invitations)
  const monitoredUsers = await EmergencyContact.find({
    contactUserId: guardianId,
    inviteStatus: 'accepted',
  })
    .populate('ownerUserId', 'name email role emergencyMode emergencyActivatedAt emergencyLocation lastActiveAt')
    .sort({ createdAt: -1 });

  // Transform to include user details and emergency status
  const usersWithStatus = monitoredUsers.map((contact) => ({
    relationshipId: contact._id,
    relationship: contact.relationship,
    user: contact.ownerUserId,
    emergencyActive: contact.ownerUserId?.emergencyMode || false,
    emergencyActivatedAt: contact.ownerUserId?.emergencyActivatedAt,
    lastActiveAt: contact.ownerUserId?.lastActiveAt,
  }));

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(
      HTTP_STATUS.OK,
      { data: usersWithStatus },
      'Monitored users retrieved successfully'
    )
  );
});

// Send invitations to all emergency contacts
export const sendAllEmergencyInvitations = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // Get all emergency contacts for this user
  const contacts = await EmergencyContact.find({ ownerUserId: userId });

  if (contacts.length === 0) {
    return res.status(HTTP_STATUS.OK).json(
      new ApiResponse(
        HTTP_STATUS.OK,
        { data: { sent: 0, failed: 0, contacts: [] } },
        'No emergency contacts found to send invitations to'
      )
    );
  }

  // Get user info
  const user = await req.user.constructor.findById(userId).select('name');
  const frontendUrl = process.env.CLIENT_URL || 'http://localhost:3000';

  let sentCount = 0;
  let failureCount = 0;
  const results = [];

  // Send invitations to each contact
  for (const contact of contacts) {
    try {
      // Generate new token
      const invitationToken = generateInvitationToken();
      contact.inviteTokenHash = hashToken(invitationToken);
      contact.inviteExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      contact.lastInvitedAt = new Date();

      // Generate invitation URL
      const invitationUrl = generateInvitationUrl(invitationToken, frontendUrl);

      // Send email
      const emailContent = composeInvitationEmail(
        contact.fullName,
        user.name,
        invitationUrl,
        contact.relationship
      );

      await sendEmail({
        to: contact.email,
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text,
      });

      console.log(`[SEND_ALL] Email sent to ${contact.email}`);

      // Send SMS if phone number exists
      if (contact.phoneNumber && contact.phoneNumber.trim()) {
        try {
          const normalizedPhone = normalizePhoneNumber(contact.phoneNumber);
          const smsContent = composeInvitationSMS(user.name, invitationUrl);
          
          const smsResult = await sendSMS(normalizedPhone, smsContent.body);
          console.log(`[SEND_ALL] SMS sent to ${normalizedPhone}:`, smsResult);
        } catch (smsError) {
          console.error(`[SEND_ALL] SMS failed for ${contact.phoneNumber}:`, smsError.message);
        }
      }

      contact.deliveryStatus.email = 'sent';
      if (contact.phoneNumber) contact.deliveryStatus.sms = 'sent';
      await contact.save();

      sentCount++;
      results.push({
        email: contact.email,
        fullName: contact.fullName,
        status: 'sent',
      });
    } catch (error) {
      failureCount++;
      console.error(`[SEND_ALL] Failed to send invitation to ${contact.email}:`, error.message);
      results.push({
        email: contact.email,
        fullName: contact.fullName,
        status: 'failed',
        error: error.message,
      });
    }
  }

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(
      HTTP_STATUS.OK,
      {
        data: {
          sent: sentCount,
          failed: failureCount,
          total: sentCount + failureCount,
          results,
        },
      },
      `Invitations sent to ${sentCount} emergency contacts${failureCount > 0 ? `, ${failureCount} failed` : ''}`
    )
  );
});

// Accept emergency contact invitation (using token)
export const acceptEmergencyContactInvitation = asyncHandler(async (req, res) => {
  const { token } = req.body;
  const userId = req.user._id;

  if (!token) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Invitation token is required');
  }

  // Find the emergency contact record by token hash
  const tokenHash = hashToken(token);
  const contact = await EmergencyContact.findOne({
    inviteTokenHash: tokenHash,
    email: req.user.email,
  }).populate('ownerUserId', 'name email');

  if (!contact) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Invalid or expired invitation');
  }

  // Check if token is expired
  if (contact.inviteExpiresAt && new Date() > contact.inviteExpiresAt) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Invitation has expired');
  }

  // Check if already accepted
  if (contact.inviteStatus === 'accepted') {
    return res.status(HTTP_STATUS.OK).json(
      new ApiResponse(
        HTTP_STATUS.OK,
        { data: contact },
        'Invitation already accepted'
      )
    );
  }

  // Update invitation status to accepted
  contact.contactUserId = userId;
  contact.inviteStatus = 'accepted';
  contact.acceptedAt = new Date();
  contact.inviteTokenHash = null; // Clear token for security
  contact.inviteExpiresAt = null;
  await contact.save();

  // Populate for response
  await contact.populate('ownerUserId', 'name email');

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(
      HTTP_STATUS.OK,
      { data: contact },
      'Invitation accepted successfully'
    )
  );
});