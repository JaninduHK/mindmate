import mongoose from 'mongoose';
import User from './models/User.model.js';
import EmergencyContact from './models/EmergencyContact.model.js';
import GuardianSignup from './models/GuardianSignup.model.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const checkJeromeAccount = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    // Look for Jerome user accounts
    console.log('🔍 Searching for Jerome user accounts...\n');
    
    const jeromes = await User.find({
      $or: [
        { name: { $regex: 'jerome', $options: 'i' } },
        { email: { $regex: 'jerome', $options: 'i' } },
        { email: 'steshansamaratunge@aiesec.net' },
      ]
    }).select('_id name email role createdAt');

    console.log(`Found ${jeromes.length} user(s):\n`);

    if (jeromes.length === 0) {
      console.log('❌ No Jerome user account found');
      console.log('\nJerome needs to:');
      console.log('1. Click the invitation link from the email/SMS');
      console.log('2. Sign up as a guardian');
      console.log('3. Then he will be able to see monitored users\n');
      process.exit(0);
    }

    for (const user of jeromes) {
      console.log(`Name: ${user.name}`);
      console.log(`Email: ${user.email}`);
      console.log(`Role: ${user.role}`);
      console.log(`ID: ${user._id}`);
      console.log(`Created: ${user.createdAt.toLocaleDateString()}`);

      // Check EmergencyContact for this user
      const asContact = await EmergencyContact.findOne({
        contactUserId: user._id,
      }).select('ownerUserId email inviteStatus relationship');

      if (asContact) {
        console.log(`✓ Emergency Contact:`);
        console.log(`  - Monitoring: ${asContact.ownerUserId}`);
        console.log(`  - Status: ${asContact.inviteStatus}`);
        console.log(`  - Relationship: ${asContact.relationship}`);
      } else {
        console.log(`✗ Not linked as an emergency contact`);
      }

      // Check GuardianSignup
      const guardianSignup = await GuardianSignup.findOne({
        userId: user._id,
      }).select('monitoredUserId signupStatus relationship');

      if (guardianSignup) {
        console.log(`✓ Guardian Signup:`);
        console.log(`  - Monitoring: ${guardianSignup.monitoredUserId}`);
        console.log(`  - Status: ${guardianSignup.signupStatus}`);
        console.log(`  - Relationship: ${guardianSignup.relationship}`);
      } else {
        console.log(`✗ No Guardian Signup record`);
      }

      console.log();
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

checkJeromeAccount();
