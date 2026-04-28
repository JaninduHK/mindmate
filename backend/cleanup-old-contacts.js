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

const cleanupOldContacts = async () => {
  try {
    console.log('\n🧹 Cleaning up old emergency contact records\n');

    const db = mongoose.connection.db;

    // Delete emergency contacts that don't have ownerUserId or contactUserId set
    const result = await db.collection('emergencycontacts').deleteMany({
      $or: [
        { ownerUserId: { $exists: false } },
        { ownerUserId: null },
        { contactUserId: { $exists: false } },
        { contactUserId: null }
      ]
    });

    console.log(`✅ Deleted ${result.deletedCount} old incomplete emergency contact records\n`);

    // Verify remaining records
    const remaining = await db.collection('emergencycontacts').find({}).toArray();
    console.log(`📋 Remaining emergency contacts: ${remaining.length}\n`);
    remaining.forEach((contact, idx) => {
      const guardian = contact.contactUserId;
      const user = contact.ownerUserId;
      console.log(`${idx + 1}. ${contact.email} (${contact.relationship})`);
      console.log(`   Guardian: ${guardian}`);
      console.log(`   User: ${user}\n`);
    });

    console.log(`${'='.repeat(60)}`);
    console.log('✅ Cleanup complete!');
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
  setTimeout(cleanupOldContacts, 1000);
});
