import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

// Define EmergencyContact schema
const emergencyContactSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  relationship: String,
  monitoredUserId: mongoose.Schema.Types.ObjectId,
  invitationToken: String,
  invitationTokenExpiry: Date,
  isRegistered: Boolean,
  createdAt: Date
}, { collection: 'emergencycontacts' });

const EmergencyContact = mongoose.model('EmergencyContact', emergencyContactSchema);

// Check all emergency contacts
const checkContacts = async () => {
  try {
    const allContacts = await EmergencyContact.find();
    
    console.log(`\n📋 Total Emergency Contacts: ${allContacts.length}\n`);
    
    if (allContacts.length > 0) {
      console.log('Contacts:');
      allContacts.forEach((contact, index) => {
        console.log(`\n${index + 1}. Name: ${contact.name}`);
        console.log(`   Email: ${contact.email}`);
        console.log(`   Phone: ${contact.phone}`);
        console.log(`   Relationship: ${contact.relationship}`);
        console.log(`   Is Registered: ${contact.isRegistered}`);
        console.log(`   Has Invitation Token: ${!!contact.invitationToken}`);
      });
    } else {
      console.log('ℹ️  No emergency contacts found in database.');
    }

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    await mongoose.connection.close();
    process.exit(1);
  }
};

// Run
connectDB().then(() => {
  setTimeout(checkContacts, 1000);
});
