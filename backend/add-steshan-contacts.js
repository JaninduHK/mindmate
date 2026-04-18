import mongoose from 'mongoose';
import User from './models/User.model.js';
import EmergencyContact from './models/EmergencyContact.model.js';
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

const addEmergencyContacts = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    // Get Steshan
    const steshan = await User.findOne({ email: 'steshan@mindmate.com' }).select('_id name email');
    
    if (!steshan) {
      console.error('❌ Steshan not found');
      process.exit(1);
    }

    console.log('✓ Found Steshan:', steshan.name);

    // Emergency contacts to add
    const contactsToAdd = [
      { fullName: 'Saman Samaratunge', email: 'saman@akbar.com', phone: '0770123456', relationship: 'brother' },
      { fullName: 'Dulain Adrian', email: 'dulain@gmail.com', phone: '0771234567', relationship: 'friend' },
      { fullName: 'Chamindu Kasun', email: 'chamindu@gmail.com', phone: '0772345678', relationship: 'friend' },
    ];

    console.log(`\nAdding ${contactsToAdd.length} emergency contacts...\n`);

    for (const contactData of contactsToAdd) {
      try {
        // Check if contact already exists
        const existing = await EmergencyContact.findOne({
          ownerUserId: steshan._id,
          email: contactData.email,
        });

        if (existing) {
          console.log(`⚠️  ${contactData.fullName} already exists, skipping...`);
          continue;
        }

        // Generate invitation token
        const invitationToken = generateInvitationToken();
        const tokenHash = hashToken(invitationToken);
        const tokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

        // Create emergency contact
        const newContact = await EmergencyContact.create({
          ownerUserId: steshan._id,
          fullName: contactData.fullName,
          email: contactData.email,
          phoneNumber: contactData.phone,
          relationship: contactData.relationship,
          inviteStatus: 'accepted', // Set to accepted immediately so they appear in Jerome's view
          lastInvitedAt: new Date(),
          deliveryStatus: {
            email: 'sent',
            sms: 'sent',
          },
        });

        console.log(`✓ Added: ${contactData.fullName} (${contactData.email})`);
      } catch (error) {
        console.error(`✗ Error adding ${contactData.fullName}:`, error.message);
      }
    }

    console.log('\n✅ Emergency contacts added successfully!');

    // Verify
    const allContacts = await EmergencyContact.find({
      ownerUserId: steshan._id,
    }).select('fullName email inviteStatus');

    console.log(`\n📋 Total contacts for Steshan: ${allContacts.length}`);
    allContacts.forEach(c => {
      console.log(`- ${c.fullName} (${c.inviteStatus})`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

addEmergencyContacts();
