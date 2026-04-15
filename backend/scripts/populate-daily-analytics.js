import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Mood from '../models/Mood.js';
import Goal from '../models/Goal.js';
import User from '../models/User.model.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://steshan:Steshan%402003@cluster0.kniz0ka.mongodb.net/Mindmate';

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    process.exit(1);
  }
};

// Get or create test user (Steshan)
const getTestUser = async () => {
  let user = await User.findOne({ email: 'steshan@example.com' });
  if (!user) {
    user = await User.create({
      name: 'Steshan Samaratunge',
      email: 'steshan@example.com',
      password: 'hashed_password_123',
      role: 'user',
    });
    console.log('✅ Created test user: Steshan');
  }
  return user;
};

// Populate mood data
const populateMoods = async (userId) => {
  const moods = [];
  
  // Today's mood (one per day)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  moods.push({
    userId,
    date: new Date(today),
    mood: 'Positive',
    keyword: 'Energetic & Happy',
    description: 'Good morning with clear mind. Had coffee, went for a run, feeling great! Afternoon was productive with good news from friends.',
  });
  
  // Past 6 days moods
  const moodSequence = [
    { mood: 'Stable', keyword: 'Calm & Focused', description: 'Regular day, managed to stay focused on work. Evening was relaxing.' },
    { mood: 'Pressure', keyword: 'Stressed', description: 'Had a tough day at work with deadlines. Feeling a bit overwhelmed but working through it.' },
    { mood: 'Low', keyword: 'Unmotivated', description: 'Feeling a bit down today. Not much energy but trying to keep up with routine.' },
    { mood: 'Positive', keyword: 'Great', description: 'Amazing day! Completed several projects and got positive feedback.' },
    { mood: 'Stable', keyword: 'Regular', description: 'Normal day, staying on track with goals and feeling balanced.' },
    { mood: 'Positive', keyword: 'Content', description: 'Good day overall. Spent quality time with family and enjoyed the evening.' },
  ];
  
  for (let i = 1; i <= 6; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    const moodData = moodSequence[i - 1];
    moods.push({
      userId,
      date: new Date(date),
      mood: moodData.mood,
      keyword: moodData.keyword,
      description: moodData.description,
    });
  }
  
  // Delete existing moods for this user
  await Mood.deleteMany({ userId });
  
  // Insert new moods
  const createdMoods = await Mood.insertMany(moods);
  console.log(`✅ Created ${createdMoods.length} mood entries (one per day for the past week)`);
  return createdMoods;
};

// Populate goal data
const populateGoals = async (userId) => {
  const goals = [];
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const testGoals = [
    // Today's goals
    {
      userId,
      goalName: 'Complete meditation session',
      goalType: 'daily',
      frequencyPerWeek: 7,
      completedSessions: 1,
      status: 'complete',
      date: new Date(today),
    },
    {
      userId,
      goalName: 'Exercise 30 minutes',
      goalType: 'daily',
      frequencyPerWeek: 5,
      completedSessions: 1,
      status: 'complete',
      date: new Date(today),
    },
    {
      userId,
      goalName: 'Read for 20 minutes',
      goalType: 'daily',
      frequencyPerWeek: 6,
      completedSessions: 0,
      status: 'in_progress',
      date: new Date(today),
    },
    {
      userId,
      goalName: 'Call a friend',
      goalType: 'weekly',
      frequencyPerWeek: 2,
      completedSessions: 0,
      status: 'not_started',
      date: new Date(today),
    },
    
    // Past 6 days goals
    {
      userId,
      goalName: 'Drink 8 glasses of water',
      goalType: 'daily',
      frequencyPerWeek: 7,
      completedSessions: 1,
      status: 'complete',
      date: new Date(new Date(today).setDate(today.getDate() - 1)),
    },
    {
      userId,
      goalName: 'Journal thoughts',
      goalType: 'daily',
      frequencyPerWeek: 5,
      completedSessions: 1,
      status: 'complete',
      date: new Date(new Date(today).setDate(today.getDate() - 2)),
    },
    {
      userId,
      goalName: 'Practice gratitude',
      goalType: 'daily',
      frequencyPerWeek: 7,
      completedSessions: 1,
      status: 'complete',
      date: new Date(new Date(today).setDate(today.getDate() - 3)),
    },
    {
      userId,
      goalName: 'Meal prep for the week',
      goalType: 'weekly',
      frequencyPerWeek: 1,
      completedSessions: 0,
      status: 'not_started',
      date: new Date(new Date(today).setDate(today.getDate() - 4)),
    },
    {
      userId,
      goalName: 'Complete online course lesson',
      goalType: 'custom',
      frequencyPerWeek: 3,
      completedSessions: 1,
      status: 'complete',
      date: new Date(new Date(today).setDate(today.getDate() - 5)),
    },
    {
      userId,
      goalName: 'Clean living space',
      goalType: 'weekly',
      frequencyPerWeek: 1,
      completedSessions: 1,
      status: 'complete',
      date: new Date(new Date(today).setDate(today.getDate() - 6)),
    },
  ];
  
  // Delete existing goals for this user
  await Goal.deleteMany({ userId });
  
  // Insert new goals
  const createdGoals = await Goal.insertMany(testGoals);
  console.log(`✅ Created ${createdGoals.length} goal entries`);
  return createdGoals;
};

// Main function
const populateData = async () => {
  try {
    await connectDB();
    
    console.log('\n📊 Populating Daily Analytics Test Data...\n');
    
    // Get or create test user
    const user = await getTestUser();
    console.log(`👤 Using user: ${user.name} (${user._id})`);
    
    // Populate moods
    console.log('\n📈 Adding Mood Entries...');
    const moods = await populateMoods(user._id);
    
    // Populate goals
    console.log('\n🎯 Adding Goal Entries...');
    const goalEntries = await populateGoals(user._id);
    
    // Show summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 DAILY ANALYTICS TEST DATA POPULATED');
    console.log('='.repeat(60));
    console.log(`\n✅ Summary:`);
    console.log(`   • User ID: ${user._id}`);
    console.log(`   • User Name: ${user.name}`);
    console.log(`   • Total Moods: ${moods.length}`);
    console.log(`   • Total Goals: ${goalEntries.length}`);
    
    console.log('\n📅 Today\'s Data:');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayMood = moods.find(m => {
      const moodDate = new Date(m.date);
      return moodDate.toDateString() === today.toDateString();
    });
    
    const todayGoals = goalEntries.filter(g => {
      const goalDate = new Date(g.createdAt);
      const goalDayStart = new Date(goalDate);
      goalDayStart.setHours(0, 0, 0, 0);
      return goalDayStart.toDateString() === today.toDateString();
    });
    
    if (todayMood) {
      console.log(`   Mood: ${todayMood.mood}`);
      console.log(`   Keyword: "${todayMood.keyword}"`);
      console.log(`   Notes: ${todayMood.description}`);
    }
    
    console.log(`\n   Goals (${todayGoals.length}):`);
    todayGoals.forEach((g, i) => {
      console.log(`      ${i + 1}. ${g.goalName} [${g.status}]`);
    });
    
    console.log('\n📊 Weekly Summary:');
    const completed = goalEntries.filter(g => g.status === 'complete').length;
    const incomplete = goalEntries.filter(g => g.status === 'incomplete').length;
    
    console.log(`   Goals Completed: ${completed}`);
    console.log(`   Goals Incomplete: ${incomplete}`);
    
    const moodCounts = {
      Positive: moods.filter(m => m.mood === 'Positive').length,
      Stable: moods.filter(m => m.mood === 'Stable').length,
      Pressure: moods.filter(m => m.mood === 'Pressure').length,
      Low: moods.filter(m => m.mood === 'Low').length,
    };
    
    console.log(`\n   Mood Distribution (all entries):`);
    console.log(`      Positive: ${moodCounts.Positive}`);
    console.log(`      Stable: ${moodCounts.Stable}`);
    console.log(`      Pressure: ${moodCounts.Pressure}`);
    console.log(`      Low: ${moodCounts.Low}`);
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ TEST DATA READY FOR DISPLAY');
    console.log('='.repeat(60));
    console.log('\n🔗 Next Steps:');
    console.log('   1. Login as guardian (Saman or Dulain)');
    console.log('   2. Go to Guardian Dashboard');
    console.log('   3. Select "Steshan Samaratunge" from user dropdown');
    console.log('   4. Scroll to "Daily Analytics" section');
    console.log('   5. See today\'s mood, goals, and charts!\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error populating data:', error);
    process.exit(1);
  }
};

populateData();
