import mongoose from 'mongoose';
import EmergencyContact from './models/EmergencyContact.model.js';
import User from './models/User.model.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const checkAllContacts = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    // Get all emergency contacts
    const allContacts = await EmergencyContact.find()
      .populate('contactUserId', 'name email role')
      .populate('ownerUserId', 'name email role');

    console.log(`📊 Total Emergency Contacts: ${allContacts.length}\n`);

    let acceptedCount = 0;
    let pendingCount = 0;

    allContacts.forEach((contact, index) => {
      const status = contact.inviteStatus;
      if (status === 'accepted') acceptedCount++;
      else if (status === 'pending') pendingCount++;

      console.log(`${index + 1}. ${contact.fullName}`);
      console.log(`   Email: ${contact.email}`);
      console.log(`   Status: ${status}`);
      console.log(`   Guardian: ${contact.contactUserId?.name || 'Not linked'}`);
      console.log(`   Owner: ${contact.ownerUserId?.name}`);
      if (status === 'pending' && contact.contactUserId) {
        console.log(`   ⚠️  PENDING BUT HAS LINKED USER - Will cause analytics access issue`);
      }
      console.log();
    });

    console.log(`\n📈 Summary:`);
    console.log(`- Accepted: ${acceptedCount}`);
    console.log(`- Pending: ${pendingCount}`);

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

checkAllContacts();
