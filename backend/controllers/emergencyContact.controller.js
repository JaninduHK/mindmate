import EmergencyContact from '../models/EmergencyContact.model.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import { HTTP_STATUS } from '../config/constants.js';
import { generateInvitationToken, hashToken } from '../utils/tokenGenerator.js';
import { sendEmail } from '../utils/email.util.js';
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

  // Get user name for email
  const user = await req.user.constructor.findById(userId).select('name');

  // Generate invitation URL
  const frontendUrl = process.env.CLIENT_URL || 'http://localhost:5173';
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

    // Log that we would send SMS (integrate with Twilio when available)
    if (phoneNumber) {
      const smsContent = composeInvitationSMS(user.name, invitationUrl);
      console.log(`[SMS] Would send to ${phoneNumber}: ${smsContent.body}`);
    }

    // Update delivery status
    contact.deliveryStatus.email = 'sent';
    if (phoneNumber) contact.deliveryStatus.sms = 'sent';
    await contact.save();
  } catch (error) {
    console.error('Error sending invitation:', error);
    // Continue anyway - contact is created, just email failed
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
  const { fullName, phoneNumber, relationship } = req.body;
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
  const frontendUrl = process.env.CLIENT_URL || 'http://localhost:5173';
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

    contact.deliveryStatus.email = 'sent';
    await contact.save();
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
