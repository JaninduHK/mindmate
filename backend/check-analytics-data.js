import mongoose from 'mongoose';
import Mood from './models/Mood.js';
import Goal from './models/Goal.js';
import User from './models/User.model.js';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get all users
    const users = await User.find().select('_id email firstName lastName').limit(5);
    console.log('\n📋 Users in database:', users.length);
    users.forEach(user => {
      console.log(`  - ${user.email} (ID: ${user._id})`);
    });

    if (users.length === 0) {
      console.log('❌ No users found!');
      process.exit(0);
    }

    // For each user, check moods and goals
    for (const user of users) {
      console.log(`\n📊 Data for ${user.email}:`);

      const moods = await Mood.find({ userId: user._id }).sort({ date: -1 }).limit(10);
      console.log(`  Moods: ${moods.length} entries`);
      moods.forEach((m, i) => {
        console.log(`    ${i + 1}. ${m.mood} on ${m.date?.toLocaleDateString() || 'N/A'}`);
      });

      const goals = await Goal.find({ userId: user._id }).sort({ createdAt: -1 }).limit(10);
      console.log(`  Goals: ${goals.length} entries`);
      goals.forEach((g, i) => {
        console.log(`    ${i + 1}. ${g.title} (${g.status})`);
      });

      // Check aggregation directly
      const moodDistribution = await Mood.aggregate([
        { $match: { userId: new mongoose.Types.ObjectId(user._id) } },
        { $group: { _id: '$mood', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]);
      console.log(`  Mood Distribution (aggregation):`, moodDistribution);

      const goalSummary = await Goal.aggregate([
        { $match: { userId: new mongoose.Types.ObjectId(user._id) } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]);
      console.log(`  Goal Summary (aggregation):`, goalSummary);
    }

    // Show totals
    console.log('\n📈 Database Totals:');
    const totalMoods = await Mood.countDocuments();
    const totalGoals = await Goal.countDocuments();
    console.log(`  Total Moods: ${totalMoods}`);
    console.log(`  Total Goals: ${totalGoals}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

connectDB();
