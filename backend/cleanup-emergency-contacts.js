import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

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

const cleanDatabase = async () => {
  try {
    console.log('\n🧹 Cleaning duplicate emergency contacts...\n');

    // The 4 contacts you added (unique identifiers: email + relationship)
    const validContacts = [
      { email: 'dulain@gmail.com', relationship: 'friend' },
      { email: 'saman@akbar.com', relationship: 'father' },
      { email: 'chamindu@gmail.com', relationship: 'therapist' },
      { email: 'steshansamaratunge@aiesec.net', relationship: 'friend' }
    ];

    // Get all contacts
    const allContacts = await EmergencyContact.find();
    console.log(`📊 Found ${allContacts.length} total contacts\n`);

    // Delete all and recreate only the valid ones
    await EmergencyContact.deleteMany({});
    console.log('✅ Deleted all old contacts\n');

    // Recreate the valid 4 contacts with new tokens
    const crypto = await import('crypto');
    const generateInvitationToken = () => crypto.default.randomBytes(32).toString('hex');

    const tokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    console.log('📝 Creating the 4 valid contacts:\n');

    for (const valid of validContacts) {
      const token = generateInvitationToken();
      const contact = await EmergencyContact.create({
        email: valid.email,
        relationship: valid.relationship,
        invitationToken: token,
        invitationTokenExpiry: tokenExpiry
      });

      console.log(`✅ ${contact.email} (${contact.relationship})`);
      console.log(`   🔗 Token: ${token.substring(0, 20)}...\n`);
    }

    console.log(`${'='.repeat(60)}`);
    console.log('✅ Database cleaned! Now you have only 4 contacts');
    console.log(`${'='.repeat(60)}\n`);

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    await mongoose.connection.close();
    process.exit(1);
  }
};

connectDB().then(() => {
  setTimeout(cleanDatabase, 1000);
});
