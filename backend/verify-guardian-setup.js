import 'dotenv/config.js';
import connectDB from './config/database.js';
import User from './models/User.model.js';
import GuardianSignup from './models/GuardianSignup.model.js';
import mongoose from 'mongoose';

/**
 * VERIFICATION SCRIPT FOR GUARDIAN SETUP
 * Use this to verify if a guardian's account is properly set up
 * Run: node verify-guardian-setup.js email@example.com
 */

async function verifyGuardianSetup(email) {
  try {
    await connectDB();
    console.log(`\n📋 VERIFYING GUARDIAN SETUP FOR: ${email}\n`);

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      console.log(`❌ User not found: ${email}`);
      return;
    }

    console.log(`✓ User found: ${user.name}`);
    console.log(`  ID: ${user._id}`);
    console.log(`  Role: ${user.role}`);

    if (user.role !== 'emergency_contact') {
      console.log(`\n⚠️  WARNING: User role is '${user.role}', expected 'emergency_contact'`);
    }

    // Check GuardianSignup
    console.log(`\n--- GUARDIANSIGNUP STATUS ---`);
    const guardianSignups = await GuardianSignup.find({
      userId: user._id,
      signupStatus: 'verified',
    });

    if (guardianSignups.length === 0) {
      console.log(`❌ No verified GuardianSignup records found`);
      console.log(`   Guardian Dashboard WILL NOT WORK until GuardianSignup is created`);
    } else {
      console.log(`✓ Found ${guardianSignups.length} GuardianSignup record(s):`);
      guardianSignups.forEach((gs, i) => {
        console.log(`\n  [${i + 1}] Monitoring User ID: ${gs.monitoredUserId}`);
        console.log(`      Signup Status: ${gs.signupStatus}`);
        console.log(`      Created: ${gs.createdAt}`);
      });
      console.log(`\n✅ READY: Guardian Dashboard should work!`);
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

// Get email from command line argument
const email = process.argv[2];
if (!email) {
  console.log('Usage: node verify-guardian-setup.js <email>');
  console.log('Example: node verify-guardian-setup.js chamindu@gmail.com');
  process.exit(1);
}

verifyGuardianSetup(email);
