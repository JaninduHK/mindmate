import 'dotenv/config';
import mongoose from 'mongoose';
import EmergencyContact from './models/EmergencyContact.model.js';
import User from './models/User.model.js';

async function check() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected\n');
    
    // Find Saman (guardian)
    const saman = await User.findOne({ email: 'saman@example.com' });
    console.log('Guardian (Saman):', saman?._id, saman?.name);
    
    // Find Steshan (user)
    const steshan = await User.findOne({ email: 'steshan@example.com' });
    console.log('User (Steshan):', steshan?._id, steshan?.name);
    
    // Check all emergency contacts
    const contacts = await EmergencyContact.find({});
    console.log('\n📋 All Emergency Contacts in DB:');
    if (contacts.length === 0) {
      console.log('  ❌ NO EMERGENCY CONTACTS EXIST');
    } else {
      contacts.forEach(c => {
        console.log(`  Guardian: ${c.contactUserId}`);
        console.log(`  User: ${c.ownerUserId}`);
        console.log(`  Status: ${c.inviteStatus}`);
        console.log('  ---');
      });
    }
    
    // Check specific relationship
    if (saman && steshan) {
      const relationship = await EmergencyContact.findOne({
        contactUserId: saman._id,
        ownerUserId: steshan._id
      });
      console.log('\n🔗 Saman → Steshan relationship:', relationship ? 'EXISTS ✅' : 'MISSING ❌');
      if (relationship) {
        console.log('  Status:', relationship.inviteStatus);
      }
    }
    
    process.exit(0);
  } catch(e) {
    console.error('❌ Error:', e.message);
    process.exit(1);
  }
}
check();
