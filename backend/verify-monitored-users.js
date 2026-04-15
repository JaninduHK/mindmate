import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.model.js';
import EmergencyContact from './models/EmergencyContact.model.js';
import Mood from './models/Mood.js';
import Goal from './models/Goal.js';
import NotificationModel from './models/Notification.model.js';

dotenv.config();

const getMoodScore = (moodType) => {
  const moodScores = {
    happy: 5, excited: 5, content: 4, peaceful: 4, calm: 4,
    sad: 1, depressed: 1, angry: 2, anxious: 2, stressed: 2,
    neutral: 3, confused: 2, tired: 2, disappointed: 2, frightened: 1,
  };
  return moodScores[moodType] || 3;
};

async function verifyMonitoredUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find saman@akbar.com
    const guardianUser = await User.findOne({ email: 'saman@akbar.com' });
    if (!guardianUser) {
      console.log('❌ Guardian user (saman@akbar.com) not found');
      return;
    }
    console.log('✅ Found guardian user:', guardianUser.name, guardianUser._id);

    // Find monitored users via emergency contacts
    const emergencyContactLinks = await EmergencyContact.find({
      contactUserId: guardianUser._id,
      inviteStatus: 'accepted',
    }).populate('ownerUserId', 'name email _id');

    console.log('\n📋 Emergency contact links found:', emergencyContactLinks.length);

    if (emergencyContactLinks.length === 0) {
      console.log('❌ No accepted emergency contact links found for guardian');
      return;
    }

    // Process each monitored user
    const usersData = await Promise.all(
      emergencyContactLinks.map(async (link) => {
        const user = link.ownerUserId;
        if (!user) return null;

        const latestMood = await Mood.findOne({ userId: user._id }).sort({
          createdAt: -1,
        });

        const goals = await Goal.find({ userId: user._id }).sort({
          createdAt: -1,
        });

        const emergencyAlerts = await NotificationModel.find({
          userId: user._id,
          type: { $in: ['emergency', 'high_risk', 'crisis'] },
        })
          .sort({ createdAt: -1 })
          .limit(5);

        const moodScore = latestMood ? getMoodScore(latestMood.mood) : 0;

        return {
          userId: user._id,
          name: user.name,
          email: user.email,
          currentMood: latestMood
            ? {
                score: moodScore,
                title: latestMood.mood,
                keyword: latestMood.keyword,
                description: latestMood.description,
                timestamp: latestMood.createdAt,
              }
            : null,
          goals: goals.map((goal) => ({
            _id: goal._id,
            title: goal.goalName,
            type: goal.goalType,
            progress: goal.status === 'complete' ? 100 : 0,
            status: goal.status,
          })),
          emergencyAlerts: emergencyAlerts.map((alert) => ({
            type: alert.type,
            title: alert.title,
            timestamp: alert.createdAt,
          })),
          lastCheckIn: user.updatedAt,
        };
      })
    );

    const validUsersData = usersData.filter((u) => u !== null);

    console.log('\n✅ Monitored users to be returned:');
    console.log(JSON.stringify(validUsersData, null, 2));

    console.log('\n📊 Summary:');
    console.log(`- Guardian: ${guardianUser.name} (${guardianUser.email})`);
    console.log(`- Monitored users: ${validUsersData.length}`);
    validUsersData.forEach((u, i) => {
      console.log(`  ${i + 1}. ${u.name} (${u.email})`);
    });
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ MongoDB connection closed');
  }
}

verifyMonitoredUsers();
