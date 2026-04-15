import EmergencyContact from '../models/EmergencyContact.model.js';
import User from '../models/User.model.js';
import Mood from '../models/Mood.js';
import Goal from '../models/Goal.js';
import NotificationModel from '../models/Notification.model.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import ApiError from '../utils/ApiError.js';

// Helper function to convert mood string to numeric score
const getMoodScore = (moodString) => {
  const moodScores = {
    'Positive': 8,
    'Stable': 6,
    'Pressure': 4,
    'Low': 2,
  };
  return moodScores[moodString] || 5;
};

// Get all users that this emergency contact is monitoring
export const getGuardianUsersStatus = asyncHandler(async (req, res) => {
  const emergencyContactId = req.user._id;

  // Find all users where this person is their emergency contact
  const emergencyContactLinks = await EmergencyContact.find({
    contactUserId: emergencyContactId,
    inviteStatus: 'accepted', // Only accepted/confirmed emergency contacts
  }).populate('ownerUserId', 'name email _id');

  if (!emergencyContactLinks || emergencyContactLinks.length === 0) {
    return res
      .status(200)
      .json(
        new ApiResponse(200, { data: [] }, 'No users under guardian care yet')
      );
  }

  // Get details for each user
  const usersData = await Promise.all(
    emergencyContactLinks.map(async (link) => {
      const user = link.ownerUserId;
      if (!user) return null;

      // Get latest mood
      const latestMood = await Mood.findOne({ userId: user._id }).sort({
        createdAt: -1,
      });

      // Get active goals
      const goals = await Goal.find({ userId: user._id }).sort({
        createdAt: -1,
      });

      // Get emergency alerts/notifications
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

  // Filter out null values
  const validUsersData = usersData.filter((u) => u !== null);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { data: validUsersData },
        'Guardian users status retrieved successfully'
      )
    );
});

// Get specific user details for guardian
export const getGuardianUserDetail = asyncHandler(async (req, res) => {
  const emergencyContactId = req.user._id;
  const { userId } = req.params;

  // Verify that this emergency contact is authorized to see this user
  const isAuthorized = await EmergencyContact.findOne({
    contactUserId: emergencyContactId,
    ownerUserId: userId,
    inviteStatus: 'accepted',
  });

  if (!isAuthorized) {
    throw new ApiError(403, 'Not authorized to view this user');
  }

  // Get user details
  const user = await User.findById(userId).select('name email _id').exec();

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  // Get mood history
  const moods = await Mood.find({ userId }).sort({ createdAt: -1 }).limit(30);

  // Get all goals
  const goals = await Goal.find({ userId }).sort({ createdAt: -1 });

  // Get emergency alerts
  const emergencyAlerts = await NotificationModel.find({
    userId,
    type: { $in: ['emergency', 'high_risk', 'crisis'] },
  })
    .sort({ createdAt: -1 })
    .limit(20);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        data: {
          userId: user._id,
          name: user.name,
          email: user.email,
          moodHistory: moods.map((m) => ({
            score: getMoodScore(m.mood),
            mood: m.mood,
            keyword: m.keyword,
            description: m.description,
            date: m.createdAt,
          })),
          goals: goals.map((g) => ({
            _id: g._id,
            title: g.goalName,
            type: g.goalType,
            progress: g.status === 'complete' ? 100 : 0,
            status: g.status,
          })),
          emergencyAlerts: emergencyAlerts.map((alert) => ({
            type: alert.type,
            title: alert.title,
            message: alert.message,
            date: alert.createdAt,
          })),
        },
      },
      'User details retrieved successfully'
    )
  );
});
