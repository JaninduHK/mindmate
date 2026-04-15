import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.model.js';
import EmergencyContact from './models/EmergencyContact.model.js';

dotenv.config();

async function verifyEmergencyContacts() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find steshan
    const steshan = await User.findOne({ email: 'steshan@example.com' });
    console.log('\n📍 Steshan User:', steshan ? steshan.name : 'NOT FOUND');
    if (!steshan) {
      console.log('❌ Steshan not found in database');
      process.exit(1);
    }

    // Find all emergency contacts where steshan is the owner
    const emergencyContacts = await EmergencyContact.find({ ownerUserId: steshan._id })
      .populate('contactUserId', 'name email');
    
    console.log('\n📋 Emergency Contacts for Steshan:');
    if (emergencyContacts.length === 0) {
      console.log('❌ No emergency contacts found for steshan');
    } else {
      emergencyContacts.forEach((ec, index) => {
        console.log(`\n${index + 1}. Contact: ${ec.contactUserId?.name || 'UNKNOWN'} (${ec.contactUserId?.email})`);
        console.log(`   Status: ${ec.inviteStatus}`);
        console.log(`   Contact ID: ${ec.contactUserId?._id}`);
      });
    }

    // Find saman, dulain, chamindu
    const guardians = await User.find({
      email: { $in: ['saman@example.com', 'dulain@example.com', 'chamindu@example.com'] }
    });

    console.log('\n\n👥 Guardian Users Found:');
    if (guardians.length === 0) {
      console.log('❌ No guardians found. Check database for guardian accounts.');
    } else {
      guardians.forEach(g => {
        console.log(`\n- ${g.name} (${g.email})`);
        console.log(`  ID: ${g._id}`);
        console.log(`  Role: ${g.role}`);
      });
    }

    // For each guardian, check what users they're monitoring
    console.log('\n\n📊 Guardian -> User Mappings:');
    for (const guardian of guardians) {
      const relationships = await EmergencyContact.find({ contactUserId: guardian._id })
        .populate('ownerUserId', 'name email');
      
      console.log(`\n${guardian.name} (${guardian.email}) is monitoring:`);
      if (relationships.length === 0) {
        console.log('  ❌ No monitored users');
      } else {
        relationships.forEach(rel => {
          console.log(`  - ${rel.ownerUserId?.name} (${rel.ownerUserId?.email}) - Status: ${rel.inviteStatus}`);
        });
      }
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

verifyEmergencyContacts();
