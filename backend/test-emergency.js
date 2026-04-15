import 'dotenv/config';
import mongoose from 'mongoose';
import EmergencyContact from './models/EmergencyContact.model.js';
import User from './models/User.model.js';

async function test() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');
    
    // Get Saman
    const saman = await User.findOne({ email: 'saman@akbar.com' });
    console.log('Saman:', {
      id: saman._id,
      name: saman.name,
      email: saman.email,
      role: saman.role
    });
    
    // Get emergency contacts for Saman
    const contacts = await EmergencyContact.find({
      contactUserId: saman._id,
      inviteStatus: 'accepted'
    }).populate('ownerUserId', 'name email _id');
    
    console.log('\n✅ Emergency Contacts Count:', contacts.length);
    contacts.forEach(c => {
      console.log({
        guardianId: c.contactUserId,
        userId: c.ownerUserId._id,
        userName: c.ownerUserId.name,
        status: c.inviteStatus
      });
    });
    
    process.exit(0);
  } catch(e) {
    console.error('ERROR:', e.message);
    process.exit(1);
  }
}
test();
