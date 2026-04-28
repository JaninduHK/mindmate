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

const diagnoseGuardianIssue = async () => {
  try {
    console.log('\n🔍 Diagnosing Guardian Dashboard Issue\n');

    // Get all collections
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    console.log('Collections in database:', collections.map(c => c.name).join(', '));

    // Check User collection
    const users = await db.collection('users').find({}).limit(5).toArray();
    console.log(`\n👥 Users (showing first 5):`);
    users.forEach((user, idx) => {
      console.log(`${idx + 1}. ${user.name} (${user.email}) - ID: ${user._id}`);
    });

    // Check EmergencyContact collection
    const emergencyContacts = await db.collection('emergencycontacts').find({}).toArray();
    console.log(`\n🚨 Emergency Contacts (${emergencyContacts.length} total):`);
    if (emergencyContacts.length > 0) {
      emergencyContacts.forEach((contact, idx) => {
        console.log(`${idx + 1}. ${contact.email}`);
        console.log(`   - Relationship: ${contact.relationship}`);
        console.log(`   - ownerUserId: ${contact.ownerUserId}`);
        console.log(`   - contactUserId: ${contact.contactUserId}`);
        console.log(`   - inviteStatus: ${contact.inviteStatus}`);
        console.log(`   - isRegistered: ${contact.isRegistered}\n`);
      });
    }

    // Check GuardianSignup collection
    const guardianSignups = await db.collection('guardiansignups').find({}).toArray();
    console.log(`\n👨‍⚖️ Guardian Signups (${guardianSignups.length} total):`);
    if (guardianSignups.length > 0) {
      guardianSignups.forEach((signup, idx) => {
        console.log(`${idx + 1}. ${signup.email}`);
        console.log(`   - userId: ${signup.userId}`);
        console.log(`   - monitoredUserId: ${signup.monitoredUserId}`);
        console.log(`   - signupStatus: ${signup.signupStatus}`);
        console.log(`   - relationship: ${signup.relationship}\n`);
      });
    }

    // Find guardians (users who have contactUserId set)
    const guardians = await db.collection('emergencycontacts')
      .find({ contactUserId: { $ne: null } })
      .distinct('contactUserId');
    
    console.log(`\n🛡️ Guardian IDs (from EmergencyContact):`);
    for (const guardianId of guardians) {
      const guardian = await db.collection('users').findOne({ _id: new mongoose.Types.ObjectId(guardianId) });
      console.log(`- ${guardian?.email || guardianId}`);
    }

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    await mongoose.connection.close();
    process.exit(1);
  }
};

connectDB().then(() => {
  setTimeout(diagnoseGuardianIssue, 1000);
});
