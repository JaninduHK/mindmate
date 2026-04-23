import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const db = mongoose.connection.db;
    
    const guardianSignups = await db.collection('guardiansignups').find({}).toArray();
    
    console.log('\n📋 Guardian-Monitored User Relationships:\n');
    guardianSignups.forEach((g, i) => {
      console.log(`${i + 1}. Guardian: ${g.email} (${g.fullName})`);
      console.log(`   User ID: ${g.userId}`);
      console.log(`   Monitors User ID: ${g.monitoredUserId}`);
      console.log(`   Status: ${g.signupStatus}\n`);
    });
    
    console.log(`✅ Total guardian-user relationships: ${guardianSignups.length}\n`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
})();
