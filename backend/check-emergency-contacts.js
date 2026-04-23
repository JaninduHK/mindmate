import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const db = mongoose.connection.db;
    
    // Get all emergency contacts
    const contacts = await db.collection('emergencycontacts').find({}).toArray();
    
    console.log('\n📋 All Emergency Contacts in database:\n');
    contacts.forEach((c, i) => {
      console.log(`${i + 1}. Full Name: ${c.fullName}`);
      console.log(`   Email: ${c.email}`);
      console.log(`   Phone: ${c.phoneNumber}`);
      console.log(`   Status: ${c.inviteStatus}`);
      console.log(`   Relationship: ${c.relationship}`);
      console.log(`   Owner User ID: ${c.ownerUserId}`);
      console.log(`   Contact User ID: ${c.contactUserId}\n`);
    });
    
    console.log(`✅ Total emergency contacts: ${contacts.length}\n`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
})();
