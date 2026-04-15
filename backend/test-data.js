import 'dotenv/config';
import mongoose from 'mongoose';
import User from './models/User.model.js';
import Mood from './models/Mood.js';
import Goal from './models/Goal.js';

async function test() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected\n');
    
    // Get Steshan
    const steshan = await User.findOne({ email: 'steshan@example.com' });
    console.log('User:', steshan._id, steshan.name);
    
    // Check moods
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const moods = await Mood.find({ userId: steshan._id });
    console.log('\n📊 All Moods:', moods.length);
    moods.forEach(m => {
      console.log(`  ${m.date.toISOString().split('T')[0]} - ${m.mood}`);
    });
    
    // Check goals
    const goals = await Goal.find({ userId: steshan._id });
    console.log('\n🎯 All Goals:', goals.length);
    goals.forEach(g => {
      console.log(`  ${g.date.toISOString().split('T')[0]} - ${g.goalName} [${g.status}]`);
    });
    
    // Check today's data specifically
    console.log('\n📅 TODAY (checking date range):');
    console.log('  From:', today.toISOString());
    console.log('  To:', tomorrow.toISOString());
    
    const todayMoods = await Mood.find({
      userId: steshan._id,
      date: { $gte: today, $lt: tomorrow }
    });
    console.log('  Moods found:', todayMoods.length);
    
    const todayGoals = await Goal.find({
      userId: steshan._id,
      date: { $gte: today, $lt: tomorrow }
    });
    console.log('  Goals found:', todayGoals.length);
    
    process.exit(0);
  } catch(e) {
    console.error('ERROR:', e.message);
    process.exit(1);
  }
}
test();
