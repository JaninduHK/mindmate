import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.model.js';

dotenv.config();

async function checkUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find all users with 'saman' or 'steshan' in email
    const users = await User.find({
      $or: [
        { email: /saman/i },
        { email: /steshan/i }
      ]
    });

    console.log('\n📋 Users found:');
    users.forEach(u => {
      console.log(`  - ${u.name} (${u.email}) - ID: ${u._id}`);
    });

    // Also list first 10 users
    const allUsers = await User.find().limit(10);
    console.log('\n📋 First 10 users in database:');
    allUsers.forEach(u => {
      console.log(`  - ${u.name} (${u.email})`);
    });
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
  }
}

checkUsers();
