import mongoose from 'mongoose';
import User from './models/User.model.js';
import EmergencyContact from './models/EmergencyContact.model.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const checkSteshanContacts = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    // Get Steshan
    const steshan = await User.findOne({ email: 'steshan@mindmate.com' }).select('_id name email');
    
    if (!steshan) {
      console.error('❌ Steshan not found');
      process.exit(1);
    }

    console.log(`👤 Steshan: ${steshan.name}\n`);

    // Get all emergency contacts FOR Steshan (where he is the owner/primary user)
    const allContacts = await EmergencyContact.find({
      ownerUserId: steshan._id,
    }).populate('contactUserId', 'name email role _id');

    console.log(`📋 Total Emergency Contacts for Steshan: ${allContacts.length}\n`);

    allContacts.forEach((contact, i) => {
      console.log(`${i + 1}. ${contact.fullName}`);
      console.log(`   Email: ${contact.email}`);
      console.log(`   Phone: ${contact.phoneNumber}`);
      console.log(`   Status: ${contact.inviteStatus}`);
      console.log(`   Guardian: ${contact.contactUserId?.name || 'Not linked'}`);
      console.log(`   Guardian ID: ${contact.contactUserId?._id || 'None'}`);
      console.log();
    });

    // Get Jerome's ID
    const jerome = await User.findOne({ email: 'steshansamaratunge@aiesec.net' });
    if (jerome) {
      console.log(`\n🔍 When Jerome (${jerome._id}) views Steshan's dashboard:`);
      console.log('It shows emergency contacts where:');
      console.log(`- ownerUserId = ${steshan._id}`);
      console.log(`- inviteStatus = 'accepted'`);
      console.log(`- contactUserId != ${jerome._id}`);
      
      const otherContacts = await EmergencyContact.find({
        ownerUserId: steshan._id,
        inviteStatus: 'accepted',
        contactUserId: { $ne: jerome._id },
      });

      console.log(`\nOther emergency contacts (excluding Jerome): ${otherContacts.length}`);
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

checkSteshanContacts();
