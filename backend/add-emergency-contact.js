import mongoose from 'mongoose';
import EmergencyContact from './models/EmergencyContact.model.js';
import User from './models/User.model.js';
import { generateInvitationToken, hashToken, generateInvitationUrl } from './utils/tokenGenerator.js';
import { sendEmail } from './utils/email.util.js';
import { sendSMS, normalizePhoneNumber } from './utils/smsService.js';
import { composeInvitationEmail } from './utils/invitationMailer.js';
import { composeInvitationSMS } from './utils/smsBodies.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const addEmergencyContact = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get Steshan's user ID (the owner)
    const steshan = await User.findOne({ email: 'steshan@mindmate.com' }).select('_id name email');
    
    if (!steshan) {
      console.error('❌ Steshan not found in database');
      process.exit(1);
    }

    console.log('✓ Found Steshan:', steshan.name);

    // Check if this contact already exists
    const existingContact = await EmergencyContact.findOne({
      email: 'steshansamaratunge@aiesec.net',
    });

    if (existingContact) {
      console.log('⚠️  Contact already exists, deleting old one...');
      await EmergencyContact.deleteOne({ _id: existingContact._id });
      console.log('✓ Old contact deleted');
    }

    // Generate invitation token
    const invitationToken = generateInvitationToken();
    const tokenHash = hashToken(invitationToken);
    const tokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Create new emergency contact
    const newContact = await EmergencyContact.create({
      ownerUserId: steshan._id,
      fullName: 'Jerome Steshan',
      email: 'steshansamaratunge@aiesec.net',
      phoneNumber: '0772534052',
      relationship: 'friend',
      inviteStatus: 'pending',
      inviteTokenHash: tokenHash,
      inviteExpiresAt: tokenExpiresAt,
      lastInvitedAt: new Date(),
      deliveryStatus: {
        email: 'queued',
        sms: 'queued',
      },
    });

    console.log('✓ Emergency contact created:', newContact._id);

    // Generate invitation URL
    const frontendUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    const invitationUrl = generateInvitationUrl(invitationToken, frontendUrl);

    console.log('\n📧 Sending invitation...');

    // Send email
    try {
      const emailContent = composeInvitationEmail(
        'Jerome Steshan',
        steshan.name,
        invitationUrl,
        'friend'
      );

      await sendEmail({
        to: 'steshansamaratunge@aiesec.net',
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text,
      });

      console.log('✓ Invitation email sent');
      newContact.deliveryStatus.email = 'sent';
    } catch (emailError) {
      console.error('✗ Email failed:', emailError.message);
      newContact.deliveryStatus.email = 'failed';
    }

    // Send SMS
    try {
      const normalizedPhone = normalizePhoneNumber('0772534052');
      const smsContent = composeInvitationSMS(steshan.name, invitationUrl);

      const smsResult = await sendSMS(normalizedPhone, smsContent.body);
      console.log('✓ Invitation SMS sent');
      newContact.deliveryStatus.sms = 'sent';
    } catch (smsError) {
      console.error('✗ SMS failed:', smsError.message);
      newContact.deliveryStatus.sms = 'failed';
    }

    // Save delivery status
    await newContact.save();

    console.log('\n✅ Emergency contact added successfully!');
    console.log('\n📋 Contact Details:');
    console.log('- Name: Jerome Steshan');
    console.log('- Email: steshansamaratunge@aiesec.net');
    console.log('- Phone: 0772534052');
    console.log('- Owner: Steshan Samaratunge');
    console.log('- Invitation Expires: 7 days');
    console.log('\n🔗 Invitation URL:', invitationUrl);

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

addEmergencyContact();
