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

const linkJeromeAccount = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    // Get Jerome's user account
    const jerome = await User.findOne({ 
      email: 'steshansamaratunge@aiesec.net' 
    }).select('_id name email role');

    if (!jerome) {
      console.error('❌ Jerome user account not found');
      process.exit(1);
    }

    console.log('✓ Found Jerome:', jerome.name);

    // Find the new Jerome Steshan emergency contact
    const emergencyContact = await EmergencyContact.findOne({
      email: 'steshansamaratunge@aiesec.net',
      inviteStatus: 'pending',
    });

    if (!emergencyContact) {
      console.error('❌ Emergency contact not found');
      process.exit(1);
    }

    console.log('✓ Found emergency contact:', emergencyContact.fullName);

    // Link Jerome to the emergency contact
    emergencyContact.contactUserId = jerome._id;
    emergencyContact.inviteStatus = 'accepted';
    emergencyContact.acceptedAt = new Date();
    await emergencyContact.save();

    console.log('✓ Linked Jerome to emergency contact');

    // Create GuardianSignup record
    const guardianSignup = await GuardianSignup.create({
      userId: jerome._id,
      emergencyContactId: emergencyContact._id,
      monitoredUserId: emergencyContact.ownerUserId,
      fullName: jerome.name,
      email: jerome.email,
      phoneNumber: emergencyContact.phoneNumber,
      relationship: emergencyContact.relationship,
      invitationToken: 'linked-' + jerome._id,
      inviteTokenHash: 'linked-' + jerome._id,
      tokenVerifiedAt: new Date(),
      signupStatus: 'verified',
      emailVerified: true,
      signupCompletedAt: new Date(),
      consentsToMonitoring: true,
      termsAccepted: true,
      privacyPolicyAccepted: true,
    });

    console.log('✓ Created GuardianSignup record');

    console.log('\n✅ Jerome is now fully linked!\n');

    // Verify the fix
    console.log('📋 Verification:');
    const updated = await EmergencyContact.findById(emergencyContact._id);
    console.log('- EmergencyContact.inviteStatus:', updated.inviteStatus);
    console.log('- EmergencyContact.contactUserId:', updated.contactUserId);
    
    const signup = await GuardianSignup.findById(guardianSignup._id);
    console.log('- GuardianSignup.signupStatus:', signup.signupStatus);
    console.log('- GuardianSignup.monitoredUserId:', signup.monitoredUserId);

    console.log('\n✓ Jerome can now see monitored users in his dashboard!');

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

linkJeromeAccount();
