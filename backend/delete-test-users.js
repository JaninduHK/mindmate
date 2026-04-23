import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Delete the 3 test user accounts
    const testEmails = ['steshan@mindmate.com', 'dulain@mindmate.com', 'steshan@example.com'];
    
    const result = await mongoose.connection.db.collection('users').deleteMany({
      email: { $in: testEmails }
    });
    
    console.log(`✅ Deleted ${result.deletedCount} test user accounts`);
    console.log('Removed emails:');
    testEmails.forEach(email => console.log(`  - ${email}`));
    
    // Verify remaining users
    const users = await mongoose.connection.db.collection('users').find({}, { projection: { email: 1, role: 1 } }).toArray();
    console.log(`\n📋 Remaining users (${users.length}):`);
    users.forEach((u, i) => {
      console.log(`${i + 1}. ${u.email} (${u.role})`);
    });
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
})();
