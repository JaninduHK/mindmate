import mongoose from 'mongoose';
import EmergencyContact from './models/EmergencyContact.model.js';
import User from './models/User.model.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const verifyEmergencyDashboard = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    // Get Steshan
    const steshan = await User.findOne({ email: 'steshan@mindmate.com' }).select('_id name email');
    
    if (!steshan) {
      console.error('❌ Steshan not found');
      process.exit(1);
    }

    // Get all emergency contacts for Steshan
    const contacts = await EmergencyContact.find({
      ownerUserId: steshan._id,
    })
      .populate('contactUserId', 'name email role')
      .sort({ createdAt: -1 });

    console.log(`📊 Emergency Contacts for ${steshan.name}:\n`);
    console.log(`Total: ${contacts.length}\n`);

    contacts.forEach((contact, index) => {
      console.log(`${index + 1}. ${contact.fullName}`);
      console.log(`   Email: ${contact.email}`);
      console.log(`   Phone: ${contact.phoneNumber}`);
      console.log(`   Relationship: ${contact.relationship}`);
      console.log(`   Status: ${contact.inviteStatus}`);
      console.log(`   Guardian: ${contact.contactUserId?.name || 'Not yet accepted'}`);
      console.log(`   Guardian Role: ${contact.contactUserId?.role || 'N/A'}`);
      console.log(`   Created: ${contact.createdAt?.toLocaleDateString()}`);
      console.log();
    });

    console.log('✅ Emergency Dashboard data loaded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

verifyEmergencyDashboard();
