import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const db = mongoose.connection.db;
    const users = await db.collection('users').find({}, { projection: { email: 1, name: 1, isActive: 1, role: 1 } }).toArray();
    
    console.log('\n📋 All users in database:\n');
    users.forEach((u, i) => {
      console.log(`${i + 1}. Email: ${u.email}`);
      console.log(`   Name: ${u.name}`);
      console.log(`   Role: ${u.role}`);
      console.log(`   Active: ${u.isActive}\n`);
    });
    
    console.log(`✅ Total users: ${users.length}\n`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
})();
