import mongoose from 'mongoose';
import EmergencyContact from './models/EmergencyContact.model.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory of the current file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from backend directory
dotenv.config({ path: path.join(__dirname, '.env') });

const fixJeromeStatus = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find Jerome's record
    const contact = await EmergencyContact.findOne({
      email: 'steshansamaratunge@aiesec.net',
    });

    if (!contact) {
      console.log('❌ Jerome not found');
      process.exit(1);
    }

    console.log('Current status:', contact.inviteStatus);

    // Update to accepted
    contact.inviteStatus = 'accepted';
    await contact.save();

    console.log('✓ Updated inviteStatus to: accepted');

    // Verify the fix
    const updated = await EmergencyContact.findOne({
      email: 'steshansamaratunge@aiesec.net',
    });

    console.log('\n✓ Verification:');
    console.log('- inviteStatus:', updated.inviteStatus);
    console.log('- contactUserId:', updated.contactUserId);
    console.log('- ownerUserId:', updated.ownerUserId);

    // Test authorization
    const authTest = await EmergencyContact.findOne({
      contactUserId: updated.contactUserId,
      ownerUserId: updated.ownerUserId,
      inviteStatus: 'accepted',
    });

    if (authTest) {
      console.log('\n🔐 Authorization check: ✓ PASS');
      console.log('Jerome can now access Steshan\'s analytics!');
    } else {
      console.log('\n🔐 Authorization check: ✗ FAIL');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

fixJeromeStatus();
