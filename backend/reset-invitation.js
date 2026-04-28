import mongoose from 'mongoose';
import EmergencyContact from './models/EmergencyContact.model.js';
import User from './models/User.model.js';
import { generateInvitationToken, hashToken, generateInvitationUrl } from './utils/tokenGenerator.js';
import { sendEmail } from './utils/email.util.js';
import { sendSMS, normalizePhoneNumber } from './utils/smsService.js';
import { composeInvitationEmail } from './utils/invitationMailer.js';
import { composeInvitationSMS } from './utils/smsBodies.js';
import dotenv from 'dotenv';

dotenv.config();

const resetInvitation = async (email) => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find the emergency contact by email
    const contact = await EmergencyContact.findOne({
      email: email.toLowerCase(),
    });

    if (!contact) {
      console.error(`Emergency contact with email ${email} not found`);
      process.exit(1);
    }

    console.log('Found contact:', {
      _id: contact._id,
      fullName: contact.fullName,
      email: contact.email,
      phoneNumber: contact.phoneNumber,
      currentStatus: contact.inviteStatus,
    });

    // Find the owner user to get their name
    const user = await User.findById(contact.ownerUserId).select('name');

    if (!user) {
      console.error('Owner user not found');
      process.exit(1);
    }

    // Generate new invitation token
    const invitationToken = generateInvitationToken();
    const tokenHash = hashToken(invitationToken);
    const tokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Update the contact record
    contact.inviteStatus = 'pending';
    contact.inviteTokenHash = tokenHash;
    contact.inviteExpiresAt = tokenExpiresAt;
    contact.lastInvitedAt = new Date();
    contact.deliveryStatus = {
      email: 'queued',
      sms: 'queued',
    };

    await contact.save();
    console.log('Contact record updated with new invitation token');

    // Generate invitation URL
    const frontendUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    const invitationUrl = generateInvitationUrl(invitationToken, frontendUrl);

    console.log('Generated invitation URL:', invitationUrl);

    // Send invitation email
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

      console.log(`✓ Invitation email sent to ${contact.email}`);
      contact.deliveryStatus.email = 'sent';
    } catch (emailError) {
      console.error('✗ Failed to send email:', emailError.message);
      contact.deliveryStatus.email = 'failed';
    }

    // Send invitation SMS
    if (contact.phoneNumber && contact.phoneNumber.trim()) {
      try {
        const normalizedPhone = normalizePhoneNumber(contact.phoneNumber);
        const smsContent = composeInvitationSMS(user.name, invitationUrl);

        const smsResult = await sendSMS(normalizedPhone, smsContent.body);
        console.log(`✓ Invitation SMS sent to ${contact.phoneNumber}`);
        contact.deliveryStatus.sms = 'sent';
      } catch (smsError) {
        console.error('✗ Failed to send SMS:', smsError.message);
        contact.deliveryStatus.sms = 'failed';
      }
    } else {
      console.log('⚠ No phone number provided for SMS');
    }

    // Save delivery status
    await contact.save();

    console.log('\n✓ Invitation reset successful!');
    console.log('Delivery Status:', contact.deliveryStatus);
    console.log('Invitation expires at:', contact.inviteExpiresAt);

    process.exit(0);
  } catch (error) {
    console.error('Error resetting invitation:', error);
    process.exit(1);
  }
};

// Get email from command line arguments or use default
const emailToReset = process.argv[2] || 'steshansamaratunge@aiesec.net';
console.log(`Resetting invitation for: ${emailToReset}\n`);

resetInvitation(emailToReset);
