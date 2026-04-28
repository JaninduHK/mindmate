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

const fixGuardianRelationships = async () => {
  try {
    console.log('\n🔧 Fixing Guardian-User Relationships\n');

    const db = mongoose.connection.db;

    // Get all GuardianSignup records
    const guardianSignups = await db.collection('guardiansignups').find({
      signupStatus: 'verified'
    }).toArray();

    console.log(`📋 Found ${guardianSignups.length} verified guardians\n`);

    let fixed = 0;

    for (const signup of guardianSignups) {
      const { email, userId, monitoredUserId, relationship } = signup;
      
      console.log(`\n🔗 Processing: ${email}`);
      console.log(`   Guardian ID: ${userId}`);
      console.log(`   Monitored User ID: ${monitoredUserId}`);
      console.log(`   Relationship: ${relationship}`);

      // Check if EmergencyContact exists for this relationship
      const existingContact = await db.collection('emergencycontacts').findOne({
        $or: [
          { email: email, ownerUserId: new mongoose.Types.ObjectId(monitoredUserId) },
          { contactUserId: new mongoose.Types.ObjectId(userId), ownerUserId: new mongoose.Types.ObjectId(monitoredUserId) }
        ]
      });

      if (existingContact) {
        console.log('   ✅ EmergencyContact already exists');
        
        // Ensure it has all required fields
        await db.collection('emergencycontacts').updateOne(
          { _id: existingContact._id },
          {
            $set: {
              ownerUserId: new mongoose.Types.ObjectId(monitoredUserId),
              contactUserId: new mongoose.Types.ObjectId(userId),
              inviteStatus: 'accepted',
              isRegistered: true,
              relationship: relationship.toLowerCase()
            }
          }
        );
        console.log('   ✅ Updated with proper relationships');
        fixed++;
      } else {
        console.log('   ⚠️  No EmergencyContact found - creating one...');
        
        // Create the EmergencyContact record
        const monitoredUser = await db.collection('users').findOne({
          _id: new mongoose.Types.ObjectId(monitoredUserId)
        });
        
        const result = await db.collection('emergencycontacts').insertOne({
          email: email,
          ownerUserId: new mongoose.Types.ObjectId(monitoredUserId),
          contactUserId: new mongoose.Types.ObjectId(userId),
          relationship: relationship.toLowerCase(),
          inviteStatus: 'accepted',
          isRegistered: true,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        
        console.log(`   ✅ Created EmergencyContact with ID: ${result.insertedId}`);
        fixed++;
      }
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log(`✅ Fixed ${fixed} guardian relationships`);
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
  setTimeout(fixGuardianRelationships, 1000);
});
