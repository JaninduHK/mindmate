// ============================================
// SEED DATA SCRIPT - Populate Demo Data
// ============================================
// This script creates demo users, moods, goals, and emergency contacts
// for testing the guardian dashboard

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

// Import models
import User from './models/User.model.js';
import Mood from './models/Mood.js';
import Goal from './models/Goal.js';
import EmergencyContact from './models/EmergencyContact.model.js';
import { USER_ROLES } from './config/constants.js';
import { EMERGENCY_RELATIONSHIP, INVITATION_STATUS } from './config/crisis.config.js';

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

async function hashPassword(password) {
  return await bcrypt.hash(password, 10);
}

async function populateSeedData() {
  try {
    console.log('\n🌱 Starting seed data population...\n');

    // ========== CREATE / UPDATE MAIN USER - STESHAN ==========
    console.log('📝 Creating main user: Steshan Samaratunge');
    
    let steshan = await User.findOne({ email: 'steshan@mindmate.com' });
    
    if (steshan) {
      console.log('   ✓ Steshan found, updating password');
      steshan.password = 'Steshan@123';  // Plain password - let the pre-save hook hash it
      await steshan.save();
    } else {
      steshan = await User.create({
        name: 'Steshan Samaratunge',
        email: 'steshan@mindmate.com',
        password: 'Steshan@123',  // Plain password - pre-save hook will hash it
        phoneNumber: '+94701234567',
        role: USER_ROLES.USER,
        dateOfBirth: '2000-05-15',
        emergencyMode: false,
        lastActiveAt: new Date(),
      });
      console.log('   ✓ Created successfully, ID:', steshan._id);
    }

    // ========== CREATE GUARDIAN 1 - SAMAN ==========
    console.log('\n👨‍⚕️ Creating guardian 1: Saman Samaratunge');
    
    let saman = await User.findOne({ email: 'saman@mindmate.com' });
    
    if (saman) {
      console.log('   ✓ Saman found, updating password');
      saman.password = 'Saman@123';  // Plain password - let the pre-save hook hash it
      await saman.save();
    } else {
      saman = await User.create({
        name: 'Saman Samaratunge',
        email: 'saman@mindmate.com',
        password: 'Saman@123',  // Plain password - pre-save hook will hash it
        phoneNumber: '+94702345678',
        role: USER_ROLES.USER,
      });
      console.log('   ✓ Created successfully, ID:', saman._id);
    }

    // ========== CREATE GUARDIAN 2 - DULAIN ==========
    console.log('\n👨‍⚕️ Creating guardian 2: Dulain Andrian');
    
    let dulain = await User.findOne({ email: 'dulain@mindmate.com' });
    
    if (dulain) {
      console.log('   ✓ Dulain found, updating password');
      dulain.password = 'Dulain@123';  // Plain password - let the pre-save hook hash it
      await dulain.save();
    } else {
      dulain = await User.create({
        name: 'Dulain Andrian',
        email: 'dulain@mindmate.com',
        password: 'Dulain@123',  // Plain password - pre-save hook will hash it
        phoneNumber: '+94703456789',
        role: USER_ROLES.USER,
      });
      console.log('   ✓ Created successfully, ID:', dulain._id);
    }

    // ========== CREATE GUARDIAN 3 - CHAMINDU ==========
    console.log('\n👨‍⚕️ Creating guardian 3: Chamindu Kasun');
    
    let chamindu = await User.findOne({ email: 'chamindu@mindmate.com' });
    
    if (chamindu) {
      console.log('   ✓ Chamindu found, updating password');
      chamindu.password = 'Chamindu@123';  // Plain password - let the pre-save hook hash it
      await chamindu.save();
    } else {
      chamindu = await User.create({
        name: 'Chamindu Kasun',
        email: 'chamindu@mindmate.com',
        password: 'Chamindu@123',  // Plain password - pre-save hook will hash it
        phoneNumber: '+94704567890',
        role: USER_ROLES.USER,
      });
      console.log('   ✓ Created successfully, ID:', chamindu._id);
    }

    // ========== CREATE MOODS ==========
    console.log('\n😊 Creating mood entries for Steshan...');
    
    // Delete old moods for this user to start fresh
    await Mood.deleteMany({ userId: steshan._id });

    const today = new Date();
    const moods = [
      {
        userId: steshan._id,
        date: new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000),
        mood: 'Stable',
        keyword: 'calm',
        description: 'Had a good day, feeling more peaceful',
      },
      {
        userId: steshan._id,
        date: new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000),
        mood: 'Positive',
        keyword: 'happy',
        description: 'Great day at work, feeling accomplished',
      },
      {
        userId: steshan._id,
        date: new Date(today.getTime() - 4 * 24 * 60 * 60 * 1000),
        mood: 'Stable',
        keyword: 'neutral',
        description: 'Normal day, nothing special',
      },
      {
        userId: steshan._id,
        date: new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000),
        mood: 'Pressure',
        keyword: 'stressed',
        description: 'Work has been quite demanding lately',
      },
      {
        userId: steshan._id,
        date: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000),
        mood: 'Low',
        keyword: 'sad',
        description: 'Feeling down today, not sure why',
      },
      {
        userId: steshan._id,
        date: new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000),
        mood: 'Low',
        keyword: 'overwhelmed',
        description: 'Everything feels too much right now',
      },
      {
        userId: steshan._id,
        date: new Date(today.getTime()),
        mood: 'Low',
        keyword: 'hopeless',
        description: 'I want to die. Everything is falling apart and I cannot handle this pain anymore',
      },
    ];

    await Mood.insertMany(moods);
    console.log(`   ✓ Created ${moods.length} mood entries`);
    moods.forEach((m, idx) => {
      console.log(`      ${idx + 1}. ${m.date.toISOString().split('T')[0]}: ${m.mood} - "${m.keyword}"`);
    });

    // ========== CREATE GOALS ==========
    console.log('\n🎯 Creating goals for Steshan...');
    
    // Delete old goals for this user
    await Goal.deleteMany({ userId: steshan._id });

    const goals = [
      {
        userId: steshan._id,
        goalName: 'Exercise 3 times a week',
        goalType: 'weekly',
        frequencyPerWeek: 3,
        completedSessions: 2,
        status: 'in_progress',
        date: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000),
      },
      {
        userId: steshan._id,
        goalName: 'Meditate daily for 10 minutes',
        goalType: 'daily',
        frequencyPerWeek: 7,
        completedSessions: 4,
        status: 'in_progress',
        date: new Date(today.getTime() - 20 * 24 * 60 * 60 * 1000),
      },
      {
        userId: steshan._id,
        goalName: 'Read one book this month',
        goalType: 'custom',
        frequencyPerWeek: 1,
        completedSessions: 0,
        status: 'not_started',
        date: new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000),
      },
      {
        userId: steshan._id,
        goalName: 'Sleep 8 hours daily',
        goalType: 'daily',
        frequencyPerWeek: 7,
        completedSessions: 7,
        status: 'complete',
        date: new Date(today.getTime() - 60 * 24 * 60 * 60 * 1000),
      },
      {
        userId: steshan._id,
        goalName: 'Talk to therapist weekly',
        goalType: 'weekly',
        frequencyPerWeek: 1,
        completedSessions: 2,
        status: 'in_progress',
        date: new Date(today.getTime() - 45 * 24 * 60 * 60 * 1000),
      },
    ];

    await Goal.insertMany(goals);
    console.log(`   ✓ Created ${goals.length} goals`);
    goals.forEach((g, idx) => {
      console.log(`      ${idx + 1}. ${g.goalName} (${g.status})`);
    });

    // ========== CREATE EMERGENCY CONTACTS ==========
    console.log('\n📞 Creating emergency contact relationships...');
    
    // Delete old emergency contacts for this user
    await EmergencyContact.deleteMany({ ownerUserId: steshan._id });

    // Create relationships
    const contacts = [
      {
        ownerUserId: steshan._id,
        contactUserId: saman._id,
        fullName: saman.name,
        email: saman.email,
        phoneNumber: saman.phoneNumber,
        relationship: EMERGENCY_RELATIONSHIP.THERAPIST,
        inviteStatus: INVITATION_STATUS.ACCEPTED,
        acceptedAt: new Date(today.getTime() - 100 * 24 * 60 * 60 * 1000),
      },
      {
        ownerUserId: steshan._id,
        contactUserId: dulain._id,
        fullName: dulain.name,
        email: dulain.email,
        phoneNumber: dulain.phoneNumber,
        relationship: EMERGENCY_RELATIONSHIP.BROTHER,
        inviteStatus: INVITATION_STATUS.ACCEPTED,
        acceptedAt: new Date(today.getTime() - 50 * 24 * 60 * 60 * 1000),
      },
      {
        ownerUserId: steshan._id,
        contactUserId: chamindu._id,
        fullName: chamindu.name,
        email: chamindu.email,
        phoneNumber: chamindu.phoneNumber,
        relationship: EMERGENCY_RELATIONSHIP.FRIEND,
        inviteStatus: INVITATION_STATUS.ACCEPTED,
        acceptedAt: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000),
      },
    ];

    await EmergencyContact.insertMany(contacts);
    console.log(`   ✓ Created ${contacts.length} emergency contacts`);
    contacts.forEach((c, idx) => {
      console.log(`      ${idx + 1}. ${c.fullName} (${c.relationship})`);
    });

    // ========== SUCCESS MESSAGE ==========
    console.log('\n' + '='.repeat(50));
    console.log('✅ SEED DATA POPULATION COMPLETE!');
    console.log('='.repeat(50));
    console.log('\n📌 LOGIN CREDENTIALS:');
    console.log('\n👤 USER (Steshan):');
    console.log('   Email: steshan@mindmate.com');
    console.log('   Password: Steshan@123');
    console.log('\n👨‍⚕️ GUARDIAN 1 (Saman):');
    console.log('   Email: saman@mindmate.com');
    console.log('   Password: Saman@123');
    console.log('   → Can see Steshan\'s data on guardian dashboard');
    console.log('\n👨‍⚕️ GUARDIAN 2 (Dulain):');
    console.log('   Email: dulain@mindmate.com');
    console.log('   Password: Dulain@123');
    console.log('   → Can see Steshan\'s data on guardian dashboard');
    console.log('\n👨‍⚕️ GUARDIAN 3 (Chamindu):');
    console.log('   Email: chamindu@mindmate.com');
    console.log('   Password: Chamindu@123');
    console.log('   → Can see Steshan\'s data on guardian dashboard');
    console.log('\n📊 DATA CREATED:');
    console.log(`   • 7 mood entries (includes high-risk keyword: "want to die")`);
    console.log(`   • 5 goals (mix of completed, in-progress, not-started)`);
    console.log(`   • 3 emergency contacts (Saman, Dulain & Chamindu as guardians`);
    console.log('\n🔴 HIGH-RISK ALERT:');
    console.log(`   Latest mood triggers CRITICAL RISK detection`);
    console.log(`   Both guardians will see RED alert on dashboard`);
    console.log('\n' + '='.repeat(50) + '\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error populating seed data:', error);
    process.exit(1);
  }
}

// ========== RUN SCRIPT ==========
connectDB().then(populateSeedData);
