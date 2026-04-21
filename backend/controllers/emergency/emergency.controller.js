import User from '../../models/User.model.js';
import EmergencyContact from '../../models/EmergencyContact.model.js';
import asyncHandler from '../../utils/asyncHandler.js';
import ApiError from '../../utils/ApiError.js';
import ApiResponse from '../../utils/ApiResponse.js';
import { HTTP_STATUS } from '../../config/constants.js';
import { sendEmail } from '../../utils/email.util.js';
import { sendSMS, normalizePhoneNumber } from '../../utils/smsService.js';
import { composeEmergencyAlertEmail } from '../../utils/emergencyAlertMailer.js';
import { composeEmergencyAlertSMS } from '../../utils/smsBodies.js';

/**
 * Trigger emergency alert - sends notifications to all accepted emergency contacts
 */
export const triggerEmergencyAlert = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { message, location } = req.body;

  // Get current user details
  const user = await User.findById(userId).select('name email phone');
  if (!user) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'User not found');
  }

  // Get all accepted emergency contacts for this user
  const emergencyContacts = await EmergencyContact.find({
    ownerUserId: userId,
    inviteStatus: 'accepted', // Only notify contacts who have accepted the invitation
  });

  if (emergencyContacts.length === 0) {
    return res.status(HTTP_STATUS.OK).json(
      new ApiResponse(
        HTTP_STATUS.OK,
        { data: { contactsNotified: 0, message: 'No accepted emergency contacts to notify' } },
        'Emergency alert triggered but no contacts to notify'
      )
    );
  }

  let emailsSent = 0;
  let smsSent = 0;
  let emailsFailed = [];
  let smsFailed = [];

  console.log(`[EMERGENCY_ALERT] Triggering emergency alert for user ${userId} to ${emergencyContacts.length} contacts`);

  // Send alerts to all emergency contacts
  for (const contact of emergencyContacts) {
    try {
      // Send email alert
      try {
        const emailContent = composeEmergencyAlertEmail(
          contact.fullName,
          user.name,
          message,
          location,
          user.email,
          user.phone
        );

        await sendEmail({
          to: contact.email,
          subject: emailContent.subject,
          html: emailContent.html,
          text: emailContent.text,
        });

        console.log(`[EMERGENCY_ALERT] Email sent to ${contact.email}`);
        emailsSent++;
      } catch (emailError) {
        console.error(`[EMERGENCY_ALERT] Email failed for ${contact.email}:`, emailError.message);
        emailsFailed.push(contact.email);
      }

      // Send SMS alert if phone number exists
      if (contact.phoneNumber && contact.phoneNumber.trim()) {
        try {
          const normalizedPhone = normalizePhoneNumber(contact.phoneNumber);
          const smsContent = composeEmergencyAlertSMS(user.name, location, message);

          const smsResult = await sendSMS(normalizedPhone, smsContent.body);
          console.log(`[EMERGENCY_ALERT] SMS sent to ${normalizedPhone}:`, smsResult);
          smsSent++;
        } catch (smsError) {
          console.error(`[EMERGENCY_ALERT] SMS failed for ${contact.phoneNumber}:`, smsError.message);
          smsFailed.push(contact.phoneNumber);
        }
      }
    } catch (error) {
      console.error(`[EMERGENCY_ALERT] Error notifying contact ${contact._id}:`, error);
    }
  }

  // Log emergency event
  console.log(`[EMERGENCY_ALERT] Alert completed: ${emailsSent} emails sent, ${smsSent} SMS sent`);

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(
      HTTP_STATUS.OK,
      {
        data: {
          contactsNotified: emergencyContacts.length,
          emailsSent,
          smsSent,
          emailsFailed,
          smsFailed,
          timestamp: new Date(),
        },
      },
      'Emergency alert sent to all contacts'
    )
  );
});

/**
 * Trigger emergency alert with all details
 * This includes: user location, medical info, emergency message
 */
export const triggerCrisisMode = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { message, location, severity = 'high', details } = req.body;

  if (!message) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Emergency message is required');
  }

  // Get current user details
  const user = await User.findById(userId).select('name email phone');
  if (!user) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'User not found');
  }

  // Get all accepted emergency contacts
  const emergencyContacts = await EmergencyContact.find({
    ownerUserId: userId,
    inviteStatus: 'accepted',
  });

  if (emergencyContacts.length === 0) {
    throw new ApiError(
      HTTP_STATUS.BAD_REQUEST,
      'Please add and accept emergency contacts before triggering crisis mode'
    );
  }

  let emailsSent = 0;
  let smsSent = 0;

  console.log(`[CRISIS_MODE] Triggering crisis mode for user ${userId}`);

  // Send detailed alerts to all contacts
  for (const contact of emergencyContacts) {
    try {
      // Send detailed email
      const emailContent = composeEmergencyAlertEmail(
        contact.fullName,
        user.name,
        message,
        location,
        user.email,
        user.phone,
        {
          severity,
          details,
          timestamp: new Date(),
        }
      );

      await sendEmail({
        to: contact.email,
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text,
      });

      console.log(`[CRISIS_MODE] Email sent to ${contact.email}`);
      emailsSent++;

      // Send SMS alert
      if (contact.phoneNumber && contact.phoneNumber.trim()) {
        try {
          const normalizedPhone = normalizePhoneNumber(contact.phoneNumber);
          const smsContent = composeEmergencyAlertSMS(user.name, location, message, severity);

          await sendSMS(normalizedPhone, smsContent.body);
          console.log(`[CRISIS_MODE] SMS sent to ${normalizedPhone}`);
          smsSent++;
        } catch (smsError) {
          console.error(`[CRISIS_MODE] SMS failed for ${contact.phoneNumber}:`, smsError.message);
        }
      }
    } catch (error) {
      console.error(`[CRISIS_MODE] Error notifying contact ${contact._id}:`, error);
    }
  }

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(
      HTTP_STATUS.OK,
      {
        data: {
          crisisModeActivated: true,
          contactsNotified: emergencyContacts.length,
          emailsSent,
          smsSent,
          timestamp: new Date(),
        },
      },
      'Crisis mode activated - emergency contacts notified'
    )
  );
});

/**
 * Get emergency alert history
 */
export const getEmergencyAlertHistory = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const limit = parseInt(req.query.limit) || 10;
  const page = parseInt(req.query.page) || 1;

  // This would require an EmergencyAlert model to track history
  // For now, return a placeholder response
  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(
      HTTP_STATUS.OK,
      { data: { alerts: [], total: 0 } },
      'Emergency alert history retrieved'
    )
  );
});
