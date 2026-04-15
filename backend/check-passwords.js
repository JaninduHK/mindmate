import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.model.js';
import bcrypt from 'bcryptjs';

dotenv.config();

async function checkPasswords() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find saman user
    const saman = await User.findOne({ email: 'saman@mindmate.com' }).select('+password');
    if (!saman) {
      console.log('❌ User not found');
      return;
    }

    console.log('\nUser found:', saman.name, saman.email);
    console.log('Password hash:', saman.password ? saman.password.substring(0, 20) + '...' : 'NO PASSWORD (null/undefined)');
    console.log('isActive:', saman.isActive);
    console.log('role:', saman.role);

    // Test password comparison if password exists
    if (saman.password) {
      const testPassword = 'Saman@123';
      const isValid = await bcrypt.compare(testPassword, saman.password);
      console.log(`\n✅ Password comparison test for "${testPassword}": ${isValid ? '✅ VALID' : '❌ INVALID'}`);

      // Also try other passwords
      const testPasswords = ['password123', 'saman', '123456', 'Test@123'];
      console.log('\nTrying other common passwords:');
      for (const pwd of testPasswords) {
        const valid = await bcrypt.compare(pwd, saman.password);
        console.log(`  "${pwd}": ${valid ? '✅ Valid' : '❌ Invalid'}`);
      }
    } else {
      console.log('❌ NO PASSWORD FIELD - Password is null or undefined');
    }

    // Check other users too
    const otherUsers = await User.find({ }).select('+password').limit(5);
    console.log('\nChecking other users:');
    otherUsers.forEach(u => {
      console.log(`  ${u.name}: hasPassword=${!!u.password}`);
    });
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
  }
}

checkPasswords();
