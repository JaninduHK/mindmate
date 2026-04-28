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

const populateMissingFields = async () => {
  try {
    console.log('\n📝 Populating missing fullName and phoneNumber fields\n');

    const db = mongoose.connection.db;

    // Get all emergency contacts
    const contacts = await db.collection('emergencycontacts').find({}).toArray();
    console.log(`Found ${contacts.length} emergency contacts\n`);

    let updated = 0;

    for (const contact of contacts) {
      const { _id, email, contactUserId } = contact;
      
      // Skip if already has fullName
      if (contact.fullName && contact.phoneNumber) {
        console.log(`✅ ${email} - Already has all fields`);
        continue;
      }

      // Get guardian signup info to find fullName and phoneNumber
      if (contactUserId) {
        const guardianSignup = await db.collection('guardiansignups').findOne({
          userId: new mongoose.Types.ObjectId(contactUserId)
        });

        if (guardianSignup) {
          const updateData = {};
          if (!contact.fullName && guardianSignup.fullName) {
            updateData.fullName = guardianSignup.fullName;
          }
          if (!contact.phoneNumber && guardianSignup.phoneNumber) {
            updateData.phoneNumber = guardianSignup.phoneNumber;
          }

          if (Object.keys(updateData).length > 0) {
            await db.collection('emergencycontacts').updateOne(
              { _id: contact._id },
              { $set: updateData }
            );
            console.log(`✅ ${email} - Updated with:`, updateData);
            updated++;
          } else {
            console.log(`⚠️  ${email} - No data found in GuardianSignup`);
          }
        } else {
          console.log(`⚠️  ${email} - No GuardianSignup found`);
        }
      } else {
        // For contacts without contactUserId, try to get from user
        const user = await db.collection('users').findOne({
          email: email
        });
        if (user) {
          const updateData = {};
          if (!contact.fullName && user.name) {
            updateData.fullName = user.name;
          }
          if (Object.keys(updateData).length > 0) {
            await db.collection('emergencycontacts').updateOne(
              { _id: contact._id },
              { $set: updateData }
            );
            console.log(`✅ ${email} - Updated with name from user:`, updateData);
            updated++;
          }
        }
      }
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log(`✅ Updated ${updated} emergency contacts`);
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
  setTimeout(populateMissingFields, 1000);
});
