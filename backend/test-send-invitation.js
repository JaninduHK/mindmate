#!/usr/bin/env node

/**
 * Test script to send emergency contact invitation
 * Usage: node test-send-invitation.js
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import EmergencyContact from './models/EmergencyContact.model.js';
import User from './models/User.model.js';
import { sendEmail } from './utils/email.util.js';
import { sendSMS, normalizePhoneNumber } from './utils/smsService.js';
import { composeInvitationEmail } from './utils/invitationMailer.js';
import { composeInvitationSMS } from './utils/smsBodies.js';
import { generateInvitationToken, generateInvitationUrl, hashToken } from './utils/tokenGenerator.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mindmate';

async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('[DB] Connected to MongoDB');
  } catch (error) {
    console.error('[DB] Connection error:', error.message);
    process.exit(1);
  }
}

async function testSendInvitation() {
  try {
    console.log('\n========================================');
    console.log('EMERGENCY CONTACT INVITATION TEST');
    console.log('========================================\n');

    // Find Jerome's emergency contact
    console.log('[TEST] Looking for Jerome Samaratunge...');
    const contact = await EmergencyContact.findOne({
      email: 'steshansamaratunge@aiesec.net',
    }).populate('ownerUserId', 'name email');

    if (!contact) {
      console.log('[TEST] Jerome contact not found. Creating test invitation...');
      
      // For testing, find any user and create an invitation
      const testUser = await User.findOne().select('_id name email');
      if (!testUser) {
        console.log('[TEST] No users found in database. Please create a user first.');
        process.exit(1);
      }

      console.log(`[TEST] Using test user: ${testUser.name} (${testUser.email})`);

      // Generate invitation token
      const invitationToken = generateInvitationToken();
      const tokenHash = hashToken(invitationToken);
      const tokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      // Create test invitation
      const testContact = await EmergencyContact.create({
        ownerUserId: testUser._id,
        fullName: 'Jerome Samaratunge',
        email: 'steshansamaratunge@aiesec.net',
        phoneNumber: '+94772345678', // Test Sri Lankan number
        relationship: 'friend',
        inviteStatus: 'pending',
        inviteTokenHash: tokenHash,
        inviteExpiresAt: tokenExpiresAt,
        lastInvitedAt: new Date(),
      });

      console.log('[TEST] Created test invitation:', testContact._id);
      return testContact;
    } else {
      console.log('[TEST] Found Jerome contact:', contact._id);
      return contact;
    }
  } catch (error) {
    console.error('[TEST] Error:', error.message);
    throw error;
  }
}

async function sendTestInvitation(contact) {
  try {
    console.log('\n[SEND] Preparing invitation for:', contact.fullName);

    // Get owner user details
    const owner = await User.findById(contact.ownerUserId).select('name');
    if (!owner) {
      console.log('[SEND] Owner not found');
      return;
    }

    // Generate new token for sending
    const invitationToken = generateInvitationToken();
    const tokenHash = hashToken(invitationToken);
    contact.inviteTokenHash = tokenHash;
    contact.inviteExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    contact.lastInvitedAt = new Date();
    await contact.save();

    // Generate invitation URL
    const frontendUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    const invitationUrl = generateInvitationUrl(invitationToken, frontendUrl);

    console.log('[SEND] Generated invitation URL:', invitationUrl);

    // ===== SEND EMAIL =====
    console.log('\n[EMAIL] Sending invitation email...');
    const emailContent = composeInvitationEmail(
      contact.fullName,
      owner.name,
      invitationUrl,
      contact.relationship
    );

    console.log('[EMAIL] Subject:', emailContent.subject);
    console.log('[EMAIL] To:', contact.email);

    try {
      await sendEmail({
        to: contact.email,
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text,
      });
      console.log('[EMAIL] ✓ Email sent successfully');
      contact.deliveryStatus.email = 'sent';
    } catch (error) {
      console.log('[EMAIL] ✗ Email send failed:', error.message);
      contact.deliveryStatus.email = 'failed';
    }

    // ===== SEND SMS =====
    if (contact.phoneNumber && contact.phoneNumber.trim()) {
      console.log('\n[SMS] Sending invitation SMS...');
      const normalizedPhone = normalizePhoneNumber(contact.phoneNumber);
      console.log('[SMS] To:', normalizedPhone);

      const smsContent = composeInvitationSMS(owner.name, invitationUrl);
      console.log('[SMS] Message preview:', smsContent.body.substring(0, 100) + '...');

      try {
        const smsResult = await sendSMS(normalizedPhone, smsContent.body);
        console.log('[SMS] ✓ SMS sent successfully:', smsResult);
        contact.deliveryStatus.sms = 'sent';
      } catch (error) {
        console.log('[SMS] ✗ SMS send failed:', error.message);
        contact.deliveryStatus.sms = 'failed';
      }
    } else {
      console.log('\n[SMS] No phone number provided - skipping SMS');
    }

    // Update contact
    await contact.save();

    console.log('\n========================================');
    console.log('INVITATION SENT SUCCESSFULLY');
    console.log('========================================');
    console.log('Email:', contact.email);
    if (contact.phoneNumber) {
      console.log('Phone:', contact.phoneNumber);
    }
    console.log('Invitation URL:', invitationUrl);
    console.log('Delivery Status:', contact.deliveryStatus);
    console.log('\n');
  } catch (error) {
    console.error('[SEND] Error:', error.message);
    throw error;
  }
}

async function main() {
  try {
    await connectDB();
    const contact = await testSendInvitation();
    await sendTestInvitation(contact);
  } catch (error) {
    console.error('[MAIN] Fatal error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('[DB] Connection closed');
    process.exit(0);
  }
}

main();
