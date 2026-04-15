import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const deleteUserByEmail = async (email) => {
  try {
    console.log(`🔍 Connecting to MongoDB...`);
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;

    // Find user by email
    const user = await db.collection('users').findOne({ email: email });
    
    if (!user) {
      console.log(`❌ User with email "${email}" not found`);
      await mongoose.connection.close();
      return;
    }

    console.log(`\n📋 Found user: ${user.name} (${email})`);
    console.log(`📍 User ID: ${user._id}`);

    // Delete from users collection
    const deleteUserResult = await db.collection('users').deleteOne({ email: email });
    console.log(`\n✅ Deleted from users collection: ${deleteUserResult.deletedCount} record(s)`);

    // Delete from emergencycontacts if this user is a contact
    const deleteEmergencyContactResult = await db.collection('emergencycontacts').deleteMany({ 
      contactUserId: user._id 
    });
    console.log(`✅ Deleted from emergencycontacts (as contact): ${deleteEmergencyContactResult.deletedCount} record(s)`);

    // Delete from emergencycontacts if this user owns them
    const deleteOwnedContactsResult = await db.collection('emergencycontacts').deleteMany({ 
      ownerUserId: user._id 
    });
    console.log(`✅ Deleted from emergencycontacts (as owner): ${deleteOwnedContactsResult.deletedCount} record(s)`);

    // Delete from guardiansignups
    const deleteGuardianSignupResult = await db.collection('guardiansignups').deleteMany({ 
      userId: user._id 
    });
    console.log(`✅ Deleted from guardiansignups: ${deleteGuardianSignupResult.deletedCount} record(s)`);

    // Delete from guardiansignins
    const deleteGuardianSigninResult = await db.collection('guardiansignins').deleteMany({ 
      userId: user._id 
    });
    console.log(`✅ Deleted from guardiansignins: ${deleteGuardianSigninResult.deletedCount} record(s)`);

    // Delete from refreshtokens
    const deleteRefreshTokenResult = await db.collection('refreshtokens').deleteMany({ 
      userId: user._id 
    });
    console.log(`✅ Deleted from refreshtokens: ${deleteRefreshTokenResult.deletedCount} record(s)`);

    console.log(`\n🎉 All records for "${email}" have been deleted successfully!`);
    console.log(`\n✨ You can now sign up with "${email}" again!\n`);

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    await mongoose.connection.close();
    process.exit(1);
  }
};

// Run the deletion
const emailToDelete = 'saman@akbar.com';
console.log(`\n🗑️  Deleting all records for: ${emailToDelete}\n`);
deleteUserByEmail(emailToDelete);
