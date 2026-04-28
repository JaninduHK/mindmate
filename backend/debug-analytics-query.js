// Quick test of the analytics logic directly in Node
import mongoose from 'mongoose';
import Mood from './models/Mood.js';
import Goal from './models/Goal.js';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const userId = new mongoose.Types.ObjectId('69d9dec7f68574bb5524cb39');
    
    console.log('\n🔍 Direct database query test:');
    
    // Test mood query with date filter
    const startDate = new Date('2026-04-01');
    const endDate = new Date('2026-04-27');
    
    const moods = await Mood.find({
      userId,
      date: { $gte: startDate, $lte: endDate }
    }).sort({ date: -1 });
    
    console.log(`✅ Found ${moods.length} moods`);
    
    // Calculate mood distribution
    const moodCounts = {};
    moods.forEach(mood => {
      const moodType = mood.mood || 'unknown';
      moodCounts[moodType] = (moodCounts[moodType] || 0) + 1;
    });
    
    const moodDistribution = Object.entries(moodCounts).map(([mood, count]) => ({
      mood,
      count,
    }));
    
    const mostCommonMood = moodDistribution.length > 0
      ? moodDistribution.reduce((prev, current) => (prev.count > current.count ? prev : current)).mood
      : 'N/A';
    
    console.log('Most Common Mood:', mostCommonMood);
    console.log('Mood Distribution:', moodDistribution);
    
    // Test goal query with createdAt filter
    const goals = await Goal.find({
      userId,
      createdAt: { $gte: startDate, $lte: endDate }
    });
    
    console.log(`✅ Found ${goals.length} goals (filtered by createdAt)`);
    
    // Also check goals without filter
    const allGoals = await Goal.find({ userId });
    console.log(`✅ Found ${allGoals.length} goals total`);
    console.log('First goal createdAt:', allGoals[0]?.createdAt);
    
    // Calculate goal summary
    const goalStatusCounts = {};
    allGoals.forEach(goal => {
      const status = goal.status || 'incomplete';
      goalStatusCounts[status] = (goalStatusCounts[status] || 0) + 1;
    });
    
    const goalSummary = Object.entries(goalStatusCounts).map(([status, count]) => ({
      _id: status,
      count,
    }));
    
    console.log('Goal Summary:', goalSummary);
    
    console.log('\n✅ Final Response would be:');
    console.log(JSON.stringify({
      mostCommonMood,
      moodDistribution,
      goalSummary,
    }, null, 2));
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

connectDB();
