import mongoose from 'mongoose';
import EmergencyContact from './models/EmergencyContact.model.js';
import User from './models/User.model.js';
import GuardianSignup from './models/GuardianSignup.model.js';
import dotenv from 'dotenv';

dotenv.config();

const checkJeromeAccess = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find Jerome's EmergencyContact entry
    const jeromeContact = await EmergencyContact.findOne({
      email: 'steshansamaratunge@aiesec.net',
    })
      .populate('contactUserId', 'name email role _id')
      .populate('ownerUserId', 'name email role _id');

    if (!jeromeContact) {
      console.log('❌ Jerome\'s emergency contact entry not found');
      process.exit(1);
    }

    console.log('\n📋 Jerome\'s EmergencyContact Record:');
    console.log('- _id:', jeromeContact._id);
    console.log('- fullName:', jeromeContact.fullName);
    console.log('- email:', jeromeContact.email);
    console.log('- inviteStatus:', jeromeContact.inviteStatus);
    console.log('- contactUserId:', jeromeContact.contactUserId?._id);
    console.log('- contactUser name:', jeromeContact.contactUserId?.name);
    console.log('- contactUser role:', jeromeContact.contactUserId?.role);
    console.log('- ownerUserId:', jeromeContact.ownerUserId?._id);
    console.log('- ownerUser name:', jeromeContact.ownerUserId?.name);
    console.log('- ownerUser role:', jeromeContact.ownerUserId?.role);

    // Check if Jerome has a User account
    if (!jeromeContact.contactUserId) {
      console.log('\n❌ Jerome does not have a linked user account');
      console.log('   Need to check if there\'s a User with email steshansamaratunge@aiesec.net');

      const user = await User.findOne({ email: 'steshansamaratunge@aiesec.net' });
      if (user) {
        console.log('   ✓ Found user with this email:');
        console.log('     - _id:', user._id);
        console.log('     - name:', user.name);
        console.log('     - role:', user.role);
        console.log('\n   Suggestion: Link this user to the EmergencyContact record');
      } else {
        console.log('   ❌ No user account found with this email');
        console.log('   Suggestion: Jerome needs to sign up with this email');
      }
    } else {
      console.log('\n✓ Jerome has a linked user account');

      // Check GuardianSignup record
      const guardianSignup = await GuardianSignup.findOne({
        userId: jeromeContact.contactUserId._id,
        monitoredUserId: jeromeContact.ownerUserId._id,
      });

      if (guardianSignup) {
        console.log('✓ GuardianSignup record found:');
        console.log('  - signupStatus:', guardianSignup.signupStatus);
      } else {
        console.log('❌ GuardianSignup record not found');
        console.log('   Suggestion: Create GuardianSignup record for Jerome');
      }

      // Test authorization check
      console.log('\n🔐 Testing Authorization Check:');
      const authTest = await EmergencyContact.findOne({
        contactUserId: jeromeContact.contactUserId._id,
        ownerUserId: jeromeContact.ownerUserId._id,
        inviteStatus: 'accepted',
      });

      if (authTest) {
        console.log('✓ Authorization check would PASS');
        console.log('  Jerome can access Steshan\'s analytics');
      } else {
        console.log('❌ Authorization check would FAIL');
        console.log('  Jerome CANNOT access Steshan\'s analytics');

        // Diagnose the issue
        console.log('\n📍 Diagnosing:');
        const contactUserCheck = await EmergencyContact.findOne({
          contactUserId: jeromeContact.contactUserId._id,
        });
        console.log('- contactUserId match:', !!contactUserCheck);

        const ownerUserCheck = await EmergencyContact.findOne({
          ownerUserId: jeromeContact.ownerUserId._id,
        });
        console.log('- ownerUserId match:', !!ownerUserCheck);

        const statusCheck = await EmergencyContact.findOne({
          inviteStatus: 'accepted',
        });
        console.log('- inviteStatus=accepted exists:', !!statusCheck);
      }
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

checkJeromeAccess();
