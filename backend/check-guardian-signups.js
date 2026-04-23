import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const db = mongoose.connection.db;
    const signups = await db.collection('guardiansignups').find({}, { projection: { email: 1, fullName: 1, signupStatus: 1 } }).toArray();
    
    console.log('\n📋 GuardianSignups in database:\n');
    signups.forEach((s, i) => {
      console.log(`${i + 1}. Email: ${s.email}`);
      console.log(`   Name: ${s.fullName}`);
      console.log(`   Status: ${s.signupStatus}\n`);
    });
    
    console.log(`✅ Total guardian signups: ${signups.length}\n`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
})();
