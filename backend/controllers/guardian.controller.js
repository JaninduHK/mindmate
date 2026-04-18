import mongoose from 'mongoose';
import EmergencyContact from '../models/EmergencyContact.model.js';
import GuardianSignup from '../models/GuardianSignup.model.js';
import GuardianSignin from '../models/GuardianSignin.model.js';
import User from '../models/User.model.js';
import Mood from '../models/Mood.js';
import Goal from '../models/Goal.js';
import NotificationModel from '../models/Notification.model.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import ApiError from '../utils/ApiError.js';
import { detectRiskKeywords, calculateUserRiskScore } from '../utils/riskDetection.js';

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

// DEBUG ENDPOINT: Check guardian's data in database
export const debugGuardianData = asyncHandler(async (req, res) => {
  const guardianId = req.user._id;
  
  console.log('[DEBUG] Checking data for guardian:', guardianId);
  
  // Check EmergencyContact records
  const emergencyContacts = await EmergencyContact.find({
    contactUserId: guardianId,
  }).select('ownerUserId contactUserId inviteStatus relationship email');
  
  console.log('[DEBUG] EmergencyContact records:', emergencyContacts);
  
  // Check GuardianSignup records
  const guardianSignups = await GuardianSignup.find({
    userId: guardianId,
  }).select('userId monitoredUserId signupStatus relationship');
  
  console.log('[DEBUG] GuardianSignup records:', guardianSignups);
  
  res.status(200).json(
    new ApiResponse(200, {
      guardianId,
      emergencyContacts: emergencyContacts.length,
      emergencyContactsData: emergencyContacts,
      guardianSignups: guardianSignups.length,
      guardianSignupsData: guardianSignups,
    }, 'Debug data')
  );
});

// Get all users that this emergency contact is monitoring
export const getGuardianUsersStatus = asyncHandler(async (req, res) => {
  const guardianId = req.user._id;

  console.log('[GUARDIAN_STATUS] Fetching monitored users for guardian:', guardianId);

  // Find all GuardianSignup records for this guardian
  const guardianSignups = await GuardianSignup.find({
    userId: guardianId,
    signupStatus: 'verified',
  }).select('monitoredUserId userId relationship email');

  console.log('[GUARDIAN_STATUS] Found GuardianSignup records:', guardianSignups?.length || 0);
  if (!guardianSignups || guardianSignups.length === 0) {
    return res
      .status(200)
      .json(
        new ApiResponse(200, { data: [] }, 'No users under guardian care yet')
      );
  }

  // Get user details for each monitored user
  const usersData = await Promise.all(
    guardianSignups.map(async (guardianSignup) => {
      const monitoredUserId = guardianSignup.monitoredUserId;
      const user = await User.findById(monitoredUserId).select('name email _id');
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
  const userObjectId = new mongoose.Types.ObjectId(userId);

  // Verify that this emergency contact is authorized to see this user
  const isAuthorized = await EmergencyContact.findOne({
    contactUserId: emergencyContactId,
    ownerUserId: userObjectId,
    inviteStatus: 'accepted',
  });

  if (!isAuthorized) {
    throw new ApiError(403, 'Not authorized to view this user');
  }

  // Get user details
  const user = await User.findById(userObjectId).select('name email _id').exec();

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  // Get mood history
  const moods = await Mood.find({ userId: userObjectId }).sort({ createdAt: -1 }).limit(30);

  // Get all goals
  const goals = await Goal.find({ userId: userObjectId }).sort({ createdAt: -1 });

  // Get emergency alerts
  const emergencyAlerts = await NotificationModel.find({
    userId: userObjectId,
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

// Get all monitored users (from GuardianSignup table, with EmergencyContact fallback)
export const getMonitoredUsers = asyncHandler(async (req, res) => {
  const guardianId = req.user._id;

  console.log('[MONITORED_USERS] Fetching for guardian ID:', guardianId);

  // First, try to get from GuardianSignup
  let guardianSignups = await GuardianSignup.find({
    userId: guardianId,
    signupStatus: 'verified',
  }).select('monitoredUserId userId relationship');

  console.log('[MONITORED_USERS] Found GuardianSignup records:', guardianSignups?.length || 0);

  // If no GuardianSignup records, fall back to EmergencyContact
  let usersData = [];
  
  if (!guardianSignups || guardianSignups.length === 0) {
    console.log('[MONITORED_USERS] No GuardianSignup records found - falling back to EmergencyContact...');
    const emergencyContacts = await EmergencyContact.find({
      contactUserId: guardianId,
      inviteStatus: 'accepted',
    }).select('ownerUserId contactUserId relationship phoneNumber').populate('ownerUserId', '_id name email updatedAt');
    
    console.log('[MONITORED_USERS] Found EmergencyContact records:', emergencyContacts?.length || 0);
    
    if (!emergencyContacts || emergencyContacts.length === 0) {
      return res
        .status(200)
        .json(
          new ApiResponse(200, { data: [] }, 'No users under guardian care yet')
        );
    }

    // Convert EmergencyContact to user data format
    usersData = await Promise.all(
      emergencyContacts.map(async (contact) => {
        const user = contact.ownerUserId;
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
  } else {
    // Use GuardianSignup records
    usersData = await Promise.all(
      guardianSignups.map(async (guardianSignup) => {
        const monitoredUserId = guardianSignup.monitoredUserId;
        const user = await User.findById(monitoredUserId).select('name email _id updatedAt');
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
  }

  const validUsersData = usersData.filter((u) => u !== null);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { data: validUsersData },
        'Monitored users retrieved successfully'
      )
    );
});

// Get guardian dashboard data for a specific user
export const getGuardianDashboard = asyncHandler(async (req, res) => {
  const guardianId = req.user._id;
  const { userId } = req.params;
  const userObjectId = new mongoose.Types.ObjectId(userId);

  console.log('[GUARDIAN_DASHBOARD] Guardian ID:', guardianId, 'Monitoring User ID:', userObjectId);

  // Verify authorization using GuardianSignup table, with EmergencyContact fallback
  let guardianSignup = await GuardianSignup.findOne({
    userId: guardianId,
    monitoredUserId: userObjectId,
    signupStatus: 'verified',
  });

  if (!guardianSignup) {
    console.log('[GUARDIAN_DASHBOARD] GuardianSignup not found - checking EmergencyContact...');
    const emergencyContact = await EmergencyContact.findOne({
      contactUserId: guardianId,
      ownerUserId: userObjectId,
      inviteStatus: 'accepted',
    });

    if (!emergencyContact) {
      console.log('[GUARDIAN_DASHBOARD] Not authorized - neither GuardianSignup nor EmergencyContact found');
      throw new ApiError(403, 'Not authorized to view this user');
    }

    console.log('[GUARDIAN_DASHBOARD] Authorized via EmergencyContact:', emergencyContact._id);
    // Create GuardianSignup record for future use
    try {
      guardianSignup = await GuardianSignup.create({
        userId: guardianId,
        emergencyContactId: emergencyContact._id,
        monitoredUserId: userObjectId,
        fullName: req.user.name,
        email: req.user.email,
        phoneNumber: emergencyContact.phoneNumber || null,
        relationship: emergencyContact.relationship,
        invitationToken: 'dashboard-sync-' + guardianId + '-' + userObjectId,
        inviteTokenHash: 'dashboard-sync-' + guardianId + '-' + userObjectId,
        tokenVerifiedAt: emergencyContact.acceptedAt || new Date(),
        signupStatus: 'verified',
        emailVerified: true,
        signupCompletedAt: emergencyContact.acceptedAt || new Date(),
        consentsToMonitoring: true,
      });
      console.log('[GUARDIAN_DASHBOARD] GuardianSignup created:', guardianSignup._id);
    } catch (error) {
      if (error.code !== 11000) {
        console.error('[GUARDIAN_DASHBOARD] Error creating GuardianSignup:', error);
      }
    }
  } else {
    console.log('[GUARDIAN_DASHBOARD] Authorized - GuardianSignup found:', guardianSignup._id);
  }

  const user = await User.findById(userObjectId).select('name email lastActiveAt _id emergencyMode emergencyActivatedAt emergencyLocation');
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  const moods = await Mood.find({ userId: userObjectId }).sort({ createdAt: -1 }).limit(30);
  const goals = await Goal.find({ userId: userObjectId }).sort({ createdAt: -1 });

  const contacts = await EmergencyContact.find({
    ownerUserId: userObjectId,
    inviteStatus: 'accepted',
    contactUserId: { $ne: guardianId },
  }).select('fullName email phoneNumber relationship contactUserId');

  const highRiskAlert = await NotificationModel.findOne({
    userId,
    type: 'HIGH_RISK_ALERT',
    severity: 'critical',
  }).sort({ createdAt: -1 });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          emergencyMode: user.emergencyMode,
          emergencyActivatedAt: user.emergencyActivatedAt,
          emergencyLocation: user.emergencyLocation,
        },
        moods: moods.map(m => ({
          date: m.createdAt ? m.createdAt.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          mood: m.mood,
          keyword: m.keyword,
          description: m.description,
        })),
        goals: goals.map(g => ({
          id: g._id,
          title: g.goalName || g.title,
          status: g.status,
          completed: g.status === 'complete',
        })),
        emergencyContacts: contacts.map(c => ({
          id: c._id,
          name: c.fullName,
          fullName: c.fullName,
          email: c.email,
          phoneNumber: c.phoneNumber,
          phone: c.phoneNumber,
          relationship: c.relationship,
          inviteStatus: c.inviteStatus,
        })),
        lastActiveTime: user.lastActiveAt,
        riskAlert: highRiskAlert ? {
          id: highRiskAlert._id,
          type: highRiskAlert.type,
          severity: highRiskAlert.severity,
          createdAt: highRiskAlert.createdAt,
          metadata: highRiskAlert.metadata,
        } : null,
      },
      'Guardian dashboard retrieved successfully'
    )
  );
});

// Get all high-risk alerts
export const getHighRiskAlerts = asyncHandler(async (req, res) => {
  const guardianId = req.user._id;

  const monitoredLinks = await EmergencyContact.find({
    contactUserId: guardianId,
    inviteStatus: 'accepted',
  }).select('ownerUserId');

  const userIds = monitoredLinks.map(link => link.ownerUserId);

  const alerts = await NotificationModel.find({
    userId: { $in: userIds },
    type: { $in: ['HIGH_RISK_ALERT', 'high_risk', 'crisis'] },
    severity: { $in: ['critical', 'high'] },
  })
    .sort({ createdAt: -1 })
    .limit(50)
    .populate('userId', 'name email');

  return res.status(200).json(
    new ApiResponse(
      200,
      { data: alerts },
      'High-risk alerts retrieved successfully'
    )
  );
});

// Acknowledge a risk alert
export const acknowledgeRiskAlert = asyncHandler(async (req, res) => {
  const { alertId } = req.params;

  const alert = await NotificationModel.findByIdAndUpdate(
    alertId,
    { read: true, acknowledgedAt: new Date() },
    { new: true }
  );

  if (!alert) {
    throw new ApiError(404, 'Alert not found');
  }

  return res.status(200).json(
    new ApiResponse(200, { data: alert }, 'Alert acknowledged successfully')
  );
});

// Contact a user (send notification)
export const contactUser = asyncHandler(async (req, res) => {
  const guardianId = req.user._id;
  const { userId } = req.params;
  const userObjectId = new mongoose.Types.ObjectId(userId);
  const { message } = req.body;

  // Verify authorization
  const isAuthorized = await EmergencyContact.findOne({
    contactUserId: guardianId,
    ownerUserId: userObjectId,
    inviteStatus: 'accepted',
  });

  if (!isAuthorized) {
    throw new ApiError(403, 'Not authorized to contact this user');
  }

  // Create notification for the user
  const notification = await NotificationModel.create({
    userId: userObjectId,
    type: 'contact',
    title: 'Guardian Contact',
    message: message || 'Your guardian has reached out to check on you.',
    read: false,
  });

  return res.status(201).json(
    new ApiResponse(
      201,
      { data: notification },
      'Guardian contact notification sent successfully'
    )
  );
});

// Get mood analytics for a user
export const getUserMoodAnalytics = asyncHandler(async (req, res) => {
  const guardianId = req.user._id;
  const { userId } = req.params;
  const userObjectId = new mongoose.Types.ObjectId(userId);

  // Verify authorization using GuardianSignup
  const guardianSignup = await GuardianSignup.findOne({
    userId: guardianId,
    monitoredUserId: userObjectId,
    signupStatus: 'verified',
  });

  if (!guardianSignup) {
    throw new ApiError(403, 'Not authorized to view this user');
  }

  // Get mood history (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  thirtyDaysAgo.setHours(0, 0, 0, 0);

  const moods = await Mood.find({
    userId: userObjectId,
    date: { $gte: thirtyDaysAgo },
  }).sort({ date: -1 });

  // Calculate mood distribution
  const moodDistribution = {
    Positive: 0,
    Stable: 0,
    Pressure: 0,
    Low: 0,
  };

  moods.forEach(m => {
    moodDistribution[m.mood]++;
  });

  // Get last 7 days for trend
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const recentMoods = await Mood.find({
    userId,
    date: { $gte: sevenDaysAgo },
  }).sort({ date: 1 });

  const trendData = recentMoods.map(m => ({
    date: m.date.toISOString().split('T')[0],
    mood: m.mood,
    score: getMoodScore(m.mood),
    keyword: m.keyword,
  }));

  // Find consecutive negative moods (LOW/Pressure)
  const negativeMoods = moods.filter(m => ['Low', 'Pressure'].includes(m.mood));
  const consecutiveNegative = negativeMoods.length >= 3;

  // Average mood score
  const avgScore = moods.length > 0 
    ? moods.reduce((sum, m) => sum + getMoodScore(m.mood), 0) / moods.length 
    : 0;

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        distribution: moodDistribution,
        trend: trendData,
        average: avgScore.toFixed(1),
        totalEntries: moods.length,
        consecutiveNegative,
        recentMoods: moods.slice(0, 5).map(m => ({
          date: m.date,
          mood: m.mood,
          score: getMoodScore(m.mood),
          keyword: m.keyword,
          description: m.description,
        })),
      },
      'Mood analytics retrieved successfully'
    )
  );
});

// Get goal analytics for a user
export const getUserGoalAnalytics = asyncHandler(async (req, res) => {
  const guardianId = req.user._id;
  const { userId } = req.params;
  const userObjectId = new mongoose.Types.ObjectId(userId);

  // Verify authorization using GuardianSignup
  const guardianSignup = await GuardianSignup.findOne({
    userId: guardianId,
    monitoredUserId: userObjectId,
    signupStatus: 'verified',
  });

  if (!guardianSignup) {
    throw new ApiError(403, 'Not authorized to view this user');
  }

  const goals = await Goal.find({ userId: userObjectId }).sort({ createdAt: -1 });

  const completed = goals.filter(g => g.status === 'complete').length;
  const incomplete = goals.filter(g => g.status === 'incomplete').length;

  const completionRate = goals.length > 0 ? (completed / goals.length * 100).toFixed(1) : 0;

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        total: goals.length,
        completed,
        incomplete,
        completionRate: parseFloat(completionRate),
        goals: goals.slice(0, 10).map(g => ({
          id: g._id,
          title: g.goalName,
          type: g.goalType,
          status: g.status,
          createdAt: g.createdAt,
        })),
      },
      'Goal analytics retrieved successfully'
    )
  );
});

// Get mood alerts (concerning patterns) - NOW WITH HIGH-RISK KEYWORD DETECTION
export const getMoodAlerts = asyncHandler(async (req, res) => {
  const guardianId = req.user._id;
  const { userId } = req.params;
  const userObjectId = new mongoose.Types.ObjectId(userId);

  // Verify authorization using GuardianSignup
  const guardianSignup = await GuardianSignup.findOne({
    userId: guardianId,
    monitoredUserId: userObjectId,
    signupStatus: 'verified',
  });

  if (!guardianSignup) {
    throw new ApiError(403, 'Not authorized to view this user');
  }

  const alerts = [];

  // Get last 14 days of moods
  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
  fourteenDaysAgo.setHours(0, 0, 0, 0);

  const recentMoods = await Mood.find({
    userId: userObjectId,
    date: { $gte: fourteenDaysAgo },
  }).sort({ date: -1 });

  // ====== HIGH-RISK KEYWORD DETECTION ======
  // Check for critical and high-risk keywords in mood entries
  const highRiskMoods = [];
  const mediumRiskMoods = [];

  recentMoods.forEach((mood) => {
    const riskDetection = detectRiskKeywords(`${mood.keyword} ${mood.description}`);
    
    if (riskDetection.hasRiskKeywords) {
      if (riskDetection.riskLevel === 'critical') {
        highRiskMoods.push({
          mood,
          keywords: riskDetection.keywords,
          riskLevel: 'critical',
        });
      } else if (riskDetection.riskLevel === 'high') {
        highRiskMoods.push({
          mood,
          keywords: riskDetection.keywords,
          riskLevel: 'high',
        });
      } else if (riskDetection.riskLevel === 'medium') {
        mediumRiskMoods.push({
          mood,
          keywords: riskDetection.keywords,
          riskLevel: 'medium',
        });
      }
    }
  });

  // Alert: CRITICAL HIGH-RISK KEYWORDS (Top Priority)
  if (highRiskMoods.some(m => m.riskLevel === 'critical')) {
    const criticalMood = highRiskMoods.find(m => m.riskLevel === 'critical');
    alerts.push({
      type: 'critical_risk_keywords',
      severity: 'critical',
      title: '🚨 CRITICAL RISK DETECTED',
      description: `User expressed concerning thoughts: "${criticalMood.keywords[0]}"`,
      fullDescription: criticalMood.mood.description,
      keywords: criticalMood.keywords,
      date: criticalMood.mood.createdAt,
      actionRequired: true,
      recommendation: 'Contact user immediately. Consider emergency services if necessary.',
    });
  }

  // Alert: HIGH-RISK KEYWORDS
  if (highRiskMoods.some(m => m.riskLevel === 'high') && !alerts.some(a => a.severity === 'critical')) {
    const highMood = highRiskMoods.find(m => m.riskLevel === 'high');
    alerts.push({
      type: 'high_risk_keywords',
      severity: 'high',
      title: '⚠️ HIGH RISK KEYWORDS',
      description: `User mentioned concerning thoughts: "${highMood.keywords[0]}"`,
      fullDescription: highMood.mood.description,
      keywords: highMood.keywords,
      date: highMood.mood.createdAt,
      actionRequired: true,
      recommendation: 'Reach out to user soon. Plan a check-in conversation.',
    });
  }

  // Alert: MEDIUM-RISK KEYWORDS
  if (mediumRiskMoods.length > 0 && alerts.length === 0) {
    const mediumMood = mediumRiskMoods[0];
    alerts.push({
      type: 'medium_risk_keywords',
      severity: 'medium',
      title: 'Moderate Concern Keywords',
      description: `User mentioned: "${mediumMood.keywords[0]}"`,
      keywords: mediumMood.keywords,
      date: mediumMood.mood.createdAt,
      recommendation: 'Consider checking in with user.',
    });
  }

  // Alert: Consecutive negative moods (3+ in a row)
  if (recentMoods.length >= 3 && alerts.length < 3) {
    let consecutiveNeg = 0;
    for (const mood of recentMoods) {
      if (['Low', 'Pressure'].includes(mood.mood)) {
        consecutiveNeg++;
        if (consecutiveNeg >= 3) {
          alerts.push({
            type: 'consecutive_negative',
            severity: 'high',
            title: 'Multiple Negative Moods',
            description: `${consecutiveNeg} days of negative mood (${mood.keyword})`,
            lastMood: mood.mood,
            count: consecutiveNeg,
            date: mood.createdAt,
            recommendation: 'Monitor user closely over next few days.',
          });
          break;
        }
      } else {
        consecutiveNeg = 0;
      }
    }
  }

  // Alert: Very low mood scores
  const veryLowMoods = recentMoods.filter(m => m.mood === 'Low');
  if (veryLowMoods.length >= 2 && alerts.length < 3) {
    alerts.push({
      type: 'very_low_moods',
      severity: 'critical',
      title: 'Very Low Mood Pattern',
      description: `${veryLowMoods.length} entries with very low mood in the last 14 days`,
      count: veryLowMoods.length,
      date: veryLowMoods[0].createdAt,
      recommendation: 'Schedule a check-in call with this user.',
    });
  }

  // Alert: Recent low mood (only if no critical alerts)
  if (recentMoods.length > 0 && recentMoods[0].mood === 'Low' && alerts.length < 3) {
    alerts.push({
      type: 'recent_low_mood',
      severity: 'high',
      title: 'Recent Low Mood',
      description: `Latest entry: "${recentMoods[0].keyword}" - ${recentMoods[0].description}`,
      keyword: recentMoods[0].keyword,
      date: recentMoods[0].createdAt,
      recommendation: 'Follow up with user about their recent mood.',
    });
  }

  // Alert: No recent mood entries (last 48 hours)
  const twoDaysAgo = new Date();
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
  const recentEntry = recentMoods.find(m => m.createdAt >= twoDaysAgo);
  
  if (!recentEntry && alerts.length < 3) {
    alerts.push({
      type: 'no_recent_entry',
      severity: 'medium',
      title: 'No Recent Mood Entry',
      description: 'No mood entry recorded in the last 48 hours',
      date: new Date(),
      recommendation: 'Encourage user to track their mood regularly.',
    });
  }

  // Calculate overall risk score
  const userRiskScore = calculateUserRiskScore(recentMoods);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        data: alerts,
        riskAssessment: {
          overallRisk: userRiskScore.overallRisk,
          riskScore: userRiskScore.riskScore,
          factors: userRiskScore.factors,
          recommendations: userRiskScore.recommendations,
          alertCount: alerts.length,
        },
      },
      'Mood alerts retrieved successfully'
    )
  );
});

// Get daily analytics for a specific user
export const getDailyAnalytics = asyncHandler(async (req, res) => {
  const guardianId = req.user._id;
  const { userId } = req.params;
  const userObjectId = new mongoose.Types.ObjectId(userId);

  console.log('🔍 getDailyAnalytics called:', { guardianId, userId, userObjectId });

  // Verify authorization
  const isAuthorized = await EmergencyContact.findOne({
    contactUserId: guardianId,
    ownerUserId: userObjectId,
    inviteStatus: 'accepted',
  });

  console.log('✅ Authorization check:', isAuthorized ? 'AUTHORIZED' : 'NOT AUTHORIZED');

  if (!isAuthorized) {
    throw new ApiError(403, 'Not authorized to view this user');
  }

  // Get today's date range
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  // ===== TODAY'S DATA =====
  // Get today's moods
  const todayMoods = await Mood.find({
    userId: userObjectId,
    date: { $gte: today, $lt: tomorrow }
  }).sort({ date: 1 });

  console.log('📊 Today moods found:', todayMoods.length);

  // Get today's goals
  const todayGoals = await Goal.find({
    userId: userObjectId,
    date: { $gte: today, $lt: tomorrow }
  });

  console.log('🎯 Today goals found:', todayGoals.length);

  // Calculate today's stats
  const latestMoodToday = todayMoods.length > 0 ? todayMoods[todayMoods.length - 1] : null;
  const todayStats = {
    mood: latestMoodToday?.mood || 'No entry',
    moodScore: latestMoodToday ? getMoodScore(latestMoodToday.mood) : 0,
    goalsCompletedToday: todayGoals.filter(g => g.status === 'complete').length,
    totalGoals: todayGoals.length,
    activitiesCount: todayMoods.length,
    lastActivityTime: latestMoodToday ? latestMoodToday.createdAt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : 'No activity',
    engagementScore: Math.round((todayMoods.length * 25) + (todayGoals.length * 12.5)),
    engagementLevel: (todayMoods.length + todayGoals.length) > 3 ? 'High' : (todayMoods.length + todayGoals.length) > 1 ? 'Moderate' : 'Low'
  };

  // ===== WEEKLY DATA =====
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const weeklyMoods = await Mood.find({
    userId: userObjectId,
    date: { $gte: sevenDaysAgo, $lt: tomorrow }
  }).sort({ date: 1 });

  const weeklyGoals = await Goal.find({
    userId: userObjectId,
    date: { $gte: sevenDaysAgo, $lt: tomorrow }
  });

  // Group by date for weekly trend
  const weeklyDataMap = {};
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    weeklyDataMap[dateStr] = {
      date: dateStr,
      moodScore: 0,
      moodCount: 0,
      engagementScore: 0,
    };
  }

  // Populate mood scores
  weeklyMoods.forEach(m => {
    const dateStr = m.date.toISOString().split('T')[0];
    if (weeklyDataMap[dateStr]) {
      weeklyDataMap[dateStr].moodScore += getMoodScore(m.mood);
      weeklyDataMap[dateStr].moodCount += 1;
    }
  });

  // Calculate average mood for each day
  Object.keys(weeklyDataMap).forEach(date => {
    if (weeklyDataMap[date].moodCount > 0) {
      weeklyDataMap[date].moodScore = Math.round(weeklyDataMap[date].moodScore / weeklyDataMap[date].moodCount * 10) / 10;
    }
  });

  // Add engagement scores
  weeklyGoals.forEach(g => {
    const dateStr = g.date.toISOString().split('T')[0];
    if (weeklyDataMap[dateStr]) {
      weeklyDataMap[dateStr].engagementScore += g.status === 'complete' ? 25 : 12;
    }
  });

  const weeklyData = Object.values(weeklyDataMap);

  // ===== MOOD HISTORY (TODAY) =====
  const moodHistory = todayMoods.map(m => ({
    mood: m.mood,
    score: getMoodScore(m.mood),
    keyword: m.keyword,
    description: m.description,
    timestamp: m.createdAt
  }));

  // ===== GOAL PROGRESS (TODAY) =====
  const goalProgress = {
    completed: todayGoals.filter(g => g.status === 'complete').length,
    inProgress: todayGoals.filter(g => g.status === 'in_progress').length,
    notStarted: todayGoals.filter(g => g.status === 'not_started').length,
  };

  // ===== ACTIVITY SUMMARY (TODAY) =====
  const activitySummary = {
    moodEntriesCount: todayMoods.length,
    goalUpdatesCount: todayGoals.length,
    sessionsCount: 1, // Placeholder - integrate with session data later
  };

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        todayStats,
        weeklyData,
        moodHistory,
        goalProgress,
        activitySummary,
      },
      'Daily analytics retrieved successfully'
    )
  );
});

// Sync guardian records from EmergencyContact - creates missing GuardianSignup records
export const syncGuardianRecords = asyncHandler(async (req, res) => {
  const guardianId = req.user._id;

  console.log('[SYNC_GUARDIAN] Starting sync for guardian:', guardianId);

  // Find all emergency contacts for this guardian
  const emergencyContacts = await EmergencyContact.find({
    contactUserId: guardianId,
    inviteStatus: 'accepted',
  }).select('_id ownerUserId phoneNumber relationship acceptedAt').populate('ownerUserId', '_id name email');

  console.log('[SYNC_GUARDIAN] Found', emergencyContacts.length, 'emergency contacts');

  const syncResults = {
    created: 0,
    updated: 0,
    failed: 0,
    errors: [],
  };

  // For each emergency contact, ensure GuardianSignup exists and is verified
  for (const emergencyContact of emergencyContacts) {
    try {
      const monitoredUserId = emergencyContact.ownerUserId._id;
      
      // Check if GuardianSignup exists
      let guardianSignup = await GuardianSignup.findOne({
        userId: guardianId,
        monitoredUserId: monitoredUserId,
      });

      if (!guardianSignup) {
        // Create new GuardianSignup record
        guardianSignup = await GuardianSignup.create({
          userId: guardianId,
          emergencyContactId: emergencyContact._id,
          monitoredUserId: monitoredUserId,
          fullName: req.user.name,
          email: req.user.email,
          phoneNumber: emergencyContact.phoneNumber || null,
          relationship: emergencyContact.relationship,
          invitationToken: 'sync-' + guardianId + '-' + monitoredUserId + '-' + Date.now(),
          inviteTokenHash: 'sync-' + guardianId + '-' + monitoredUserId + '-' + Date.now(),
          tokenVerifiedAt: emergencyContact.acceptedAt || new Date(),
          signupStatus: 'verified',
          emailVerified: true,
          signupCompletedAt: emergencyContact.acceptedAt || new Date(),
          consentsToMonitoring: true,
        });
        console.log('[SYNC_GUARDIAN] Created GuardianSignup for', emergencyContact.ownerUserId.name);
        syncResults.created++;
      } else if (guardianSignup.signupStatus !== 'verified') {
        // Update existing record to verified
        guardianSignup.signupStatus = 'verified';
        guardianSignup.tokenVerifiedAt = emergencyContact.acceptedAt || new Date();
        guardianSignup.signupCompletedAt = emergencyContact.acceptedAt || new Date();
        await guardianSignup.save();
        console.log('[SYNC_GUARDIAN] Updated GuardianSignup status to verified for', emergencyContact.ownerUserId.name);
        syncResults.updated++;
      } else {
        console.log('[SYNC_GUARDIAN] GuardianSignup already exists and verified for', emergencyContact.ownerUserId.name);
      }
    } catch (error) {
      console.error('[SYNC_GUARDIAN] Error processing emergency contact:', error);
      syncResults.failed++;
      syncResults.errors.push({
        contactId: emergencyContact._id,
        error: error.message,
      });
    }
  }

  console.log('[SYNC_GUARDIAN] Sync complete:', syncResults);

  return res.status(200).json(
    new ApiResponse(
      200,
      syncResults,
      `Guardian records sync completed. Created: ${syncResults.created}, Updated: ${syncResults.updated}, Failed: ${syncResults.failed}`
    )
  );
});

// Get analytics summary for a monitored user
export const getAnalyticsSummary = asyncHandler(async (req, res) => {
  const guardianId = req.user._id;
  const { userId } = req.params;

  // Convert userId to ObjectId for proper comparison
  const userObjectId = new mongoose.Types.ObjectId(userId);

  console.log('🔍 getAnalyticsSummary called:', { guardianId, userId, userObjectId });

  // Verify authorization
  const isAuthorized = await EmergencyContact.findOne({
    contactUserId: guardianId,
    ownerUserId: userObjectId,
    inviteStatus: 'accepted',
  });

  console.log('✅ Authorization check:', isAuthorized ? 'AUTHORIZED' : 'NOT AUTHORIZED');

  if (!isAuthorized) {
    throw new ApiError(403, 'Not authorized to view this user');
  }

  const today = new Date();
  const startOfTodayUTC = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())
  );

  const [mostCommonMoodAgg, stressCount, moodCounts, missingGoalsCount, goalCounts] = await Promise.all([
    Mood.aggregate([
      { $match: { userId: { $eq: userObjectId } } },
      { $group: { _id: '$mood', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 },
    ]),
    Mood.countDocuments({ userId: userObjectId, mood: 'Pressure' }),
    Mood.aggregate([
      { $match: { userId: { $eq: userObjectId } } },
      { $group: { _id: '$mood', count: { $sum: 1 } } },
    ]),
    Goal.countDocuments({ userId: userObjectId, status: 'incomplete', date: { $lt: startOfTodayUTC } }),
    Goal.aggregate([
      { $match: { userId: { $eq: userObjectId } } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
  ]);

  console.log('📊 Analytics data:', { mostCommonMood: mostCommonMoodAgg?.[0]?._id, moodCounts, goalCounts });

  const mostCommonMood = mostCommonMoodAgg?.[0]?._id ?? null;

  const moodOrder = ['Positive', 'Stable', 'Pressure', 'Low'];
  const totalMoods = (moodCounts ?? []).reduce((sum, r) => sum + (r?.count ?? 0), 0);
  const moodDistribution = moodOrder.map((mood) => {
    const found = (moodCounts ?? []).find((r) => r?._id === mood);
    const count = found?.count ?? 0;
    const percent = totalMoods > 0 ? (count / totalMoods) * 100 : 0;
    return { mood, count, percent };
  });

  const goalSummary = goalCounts ?? [];

  res.json(
    new ApiResponse(
      200,
      {
        mostCommonMood,
        stressCount,
        missingGoalsCount,
        moodDistribution,
        goalSummary,
      },
      'Analytics summary retrieved'
    )
  );
});
