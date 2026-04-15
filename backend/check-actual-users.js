import 'dotenv/config';
import mongoose from 'mongoose';
import User from './models/User.model.js';
import EmergencyContact from './models/EmergencyContact.model.js';

async function check() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    // Get all users
    const users = await User.find().select('_id name email role');
    console.log('📋 ALL USERS IN DATABASE:');
    users.forEach(u => {
      console.log(`  • ${u.email} (${u.name}) - Role: ${u.role}`);
    });
    
    // Get all emergency contacts
    console.log('\n📞 ALL EMERGENCY CONTACTS:');
    const contacts = await EmergencyContact.find()
      .populate('ownerUserId', 'name email')
      .populate('contactUserId', 'name email');
    
    if (contacts.length === 0) {
      console.log('  (none found)');
    } else {
      contacts.forEach(c => {
        console.log(`  • ${c.ownerUserId?.email} → ${c.contactUserId?.email} (${c.relationship})`);
      });
    }
    
    process.exit(0);
  } catch(e) {
    console.error('❌ Error:', e.message);
    process.exit(1);
  }
}
check();
