import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from './models/User.model.js';
import EmergencyContact from './models/EmergencyContact.model.js';
import { USER_ROLES } from './config/constants.js';
import { EMERGENCY_RELATIONSHIP, INVITATION_STATUS } from './config/crisis.config.js';

async function fixEmergencyContacts() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get main user
    const mainUser = await User.findOne({ email: 'samaratungesteshan@gmail.com' });
    if (!mainUser) {
      console.log('❌ Main user samaratungesteshan@gmail.com not found');
      process.exit(1);
    }
    console.log(`✅ Found main user: ${mainUser.email}`);

    // Create/Update emergency contact 1: saman@akbar.com
    console.log('\n📝 Setting up emergency contact: saman@akbar.com');
    let saman = await User.findOne({ email: 'saman@akbar.com' });
    if (!saman) {
      saman = await User.create({
        name: 'Saman Akbar',
        email: 'saman@akbar.com',
        password: 'Saman@123',
        phoneNumber: '+94701234567',
        role: USER_ROLES.EMERGENCY_CONTACT,
      });
      console.log('   ✓ Created new user with emergency_contact role');
    } else {
      saman.role = USER_ROLES.EMERGENCY_CONTACT;
      await saman.save();
      console.log('   ✓ Updated role to emergency_contact');
    }

    // Create/Update emergency contact 2: dulain@gmail.com
    console.log('\n📝 Setting up emergency contact: dulain@gmail.com');
    let dulain = await User.findOne({ email: 'dulain@gmail.com' });
    if (!dulain) {
      dulain = await User.create({
        name: 'Dulain Adrian',
        email: 'dulain@gmail.com',
        password: 'Dulain@123',
        phoneNumber: '+94702345678',
        role: USER_ROLES.EMERGENCY_CONTACT,
      });
      console.log('   ✓ Created new user with emergency_contact role');
    } else {
      dulain.role = USER_ROLES.EMERGENCY_CONTACT;
      await dulain.save();
      console.log('   ✓ Updated role to emergency_contact');
    }

    // Clear old broken emergency contacts
    console.log('\n🗑️ Cleaning up broken emergency contact links...');
    await EmergencyContact.deleteMany({ ownerUserId: mainUser._id });
    console.log('   ✓ Cleared old links');

    // Create proper emergency contact relationships
    console.log('\n📞 Creating emergency contact relationships...');
    
    const contacts = [
      {
        ownerUserId: mainUser._id,
        contactUserId: saman._id,
        fullName: saman.name,
        email: saman.email,
        phoneNumber: saman.phoneNumber,
        relationship: EMERGENCY_RELATIONSHIP.THERAPIST,
        inviteStatus: INVITATION_STATUS.ACCEPTED,
        acceptedAt: new Date(),
      },
      {
        ownerUserId: mainUser._id,
        contactUserId: dulain._id,
        fullName: dulain.name,
        email: dulain.email,
        phoneNumber: dulain.phoneNumber,
        relationship: EMERGENCY_RELATIONSHIP.BROTHER,
        inviteStatus: INVITATION_STATUS.ACCEPTED,
        acceptedAt: new Date(),
      },
    ];

    await EmergencyContact.insertMany(contacts);
    console.log('   ✓ Created relationships');

    // Show summary
    console.log('\n' + '='.repeat(60));
    console.log('✅ EMERGENCY CONTACTS SETUP COMPLETE!');
    console.log('='.repeat(60));
    console.log('\n📌 LOGIN CREDENTIALS:');
    console.log('\n👤 MAIN USER (Steshan):');
    console.log('   Email: samaratungesteshan@gmail.com');
    console.log('   Password: (your existing password)');
    console.log('\n👨‍⚕️ EMERGENCY CONTACT 1 (Saman):');
    console.log('   Email: saman@akbar.com');
    console.log('   Password: Saman@123');
    console.log('   → Can see Steshan\'s mood analytics on guardian dashboard');
    console.log('\n👨‍⚕️ EMERGENCY CONTACT 2 (Dulain):');
    console.log('   Email: dulain@gmail.com');
    console.log('   Password: Dulain@123');
    console.log('   → Can see Steshan\'s mood analytics on guardian dashboard');
    console.log('\n' + '='.repeat(60) + '\n');

    process.exit(0);
  } catch (e) {
    console.error('❌ Error:', e.message);
    process.exit(1);
  }
}

fixEmergencyContacts();
