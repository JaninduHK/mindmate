import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import Mood from '../models/Mood.js';
import { HTTP_STATUS } from '../config/constants.js';
import { analyzeRiskLevel } from '../services/riskDetection.service.js';
import Notification from '../models/Notification.model.js';
import EmergencyContact from '../models/EmergencyContact.model.js';
import User from '../models/User.model.js';
import { sendEmail } from '../utils/email.util.js';
import { sendSMS, normalizePhoneNumber } from '../utils/smsService.js';
import { composeEmergencyAlertEmail } from '../utils/invitationMailer.js';
import { composeEmergencyAlertSMS } from '../utils/smsBodies.js';

const toUTCDateOnly = (input) => {
  if (!input) return null;

  const d = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(d.getTime())) return null;

  // Normalize to midnight UTC for stable uniqueness per-day
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
};

const formatDateOnly = (d) => {
  if (!d) return null;
  return new Date(d).toISOString().slice(0, 10);
};

const parseDateParamOrBody = ({ paramDate, bodyDate }) => {
  const raw = paramDate ?? bodyDate;
  if (raw === undefined) return toUTCDateOnly(new Date());
  const dateOnly = toUTCDateOnly(raw);
  return dateOnly;
};

export const addMood = asyncHandler(async (req, res) => {
  const { mood, keyword, description, date } = req.body;

  const dateOnly = parseDateParamOrBody({ bodyDate: date });
  if (!dateOnly) throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Invalid date');

  const userId = req.user.id;

  const existing = await Mood.findOne({ userId, date: dateOnly }).lean();
  if (existing) {
    throw new ApiError(HTTP_STATUS.CONFLICT, 'Mood already exists for this date');
  }

  const moodEntry = await Mood.create({
    userId,
    date: dateOnly,
    mood,
    keyword,
    description,
  });

  // ========================================
  // RISK DETECTION & GUARDIAN NOTIFICATION
  // ========================================
  const riskAnalysis = analyzeRiskLevel(description, mood);
  
  if (riskAnalysis.level === 'HIGH_RISK') {
    try {
      // Get all accepted emergency contacts
      const emergencyContacts = await EmergencyContact.find({
        ownerUserId: userId,
        inviteStatus: 'accepted',
      });

      // Get current user info
      const user = await User.findById(userId).select('name email');

      // Create notifications for all emergency contacts
      if (emergencyContacts.length > 0) {
        const notifications = emergencyContacts.map((contact) => ({
          recipientUserId: contact.contactUserId,
          relatedUserId: userId,
          type: 'HIGH_RISK_ALERT',
          severity: 'critical',
          title: `⚠️ HIGH RISK ALERT: ${user.name} needs attention`,
          message: `User is showing signs of severe distress. Keyword: "${riskAnalysis.triggerKeyword}". Last mood: ${mood}`,
          metadata: {
            riskScore: 'HIGH',
            triggerKeyword: riskAnalysis.triggerKeyword,
            moodType: mood,
            moodDescription: description,
          },
          isRead: false,
        }));

        await Notification.insertMany(notifications);
      }

        // Send email and SMS to each contact
        for (const contact of emergencyContacts) {
          try {
            const frontendUrl = process.env.CLIENT_URL || 'http://localhost:3003';
            const dashboardUrl = `${frontendUrl}/guardian-dashboard`;
            const alertMsg = `Auto-activated emergency mode due to high-risk mood keyword: "${riskAnalysis.triggerKeyword}"`;

            // Email
            const emailContent = composeEmergencyAlertEmail(
              contact.fullName || contact.email,
              dashboardUrl,
              '911' // placeholder emergency number
            );
            await sendEmail({
              to: contact.email,
              subject: `🚨 Emergency Alert: ${user.name} reported a high-risk mood`,
              html: emailContent.html,
              text: emailContent.text,
            });

            // SMS
            if (contact.phoneNumber) {
              const smsContent = composeEmergencyAlertSMS(user.name, null, alertMsg, 'critical');
              const normalizedPhone = normalizePhoneNumber(contact.phoneNumber);
              await sendSMS(normalizedPhone, smsContent.body);
            }
          } catch (notifErr) {
            console.error('Error sending sms/email for high risk mood:', notifErr);
          }
        }

      // Emit socket event to notify guardians and user in real-time
      if (global.io) {
        // Activate emergency mode for the user automatically
        global.io.to(`user_${userId}`).emit('EMERGENCY_ACTIVATED', {
          reason: 'High risk mood detected',
        });

        // Notify contacts
        emergencyContacts.forEach((contact) => {
          global.io.to(`user_${contact.contactUserId}`).emit('HIGH_RISK_ALERT', {
            userId,
            userName: user.name,
            moodType: mood,
            triggerKeyword: riskAnalysis.triggerKeyword,
            timestamp: new Date(),
          });
          global.io.to(`user_${contact.contactUserId}`).emit('EMERGENCY_ACTIVATED', {
            userId,
            userName: user.name,
          });
        });
      }
    } catch (error) {
      console.error('Error creating risk notifications:', error);
      // Don't fail the mood creation if notification fails
    }
  }

  const response = moodEntry.toObject();
  response.date = formatDateOnly(response.date);
  response.riskLevel = riskAnalysis.level;
  delete response.userId;

  res.status(HTTP_STATUS.CREATED).json(
    new ApiResponse(
      HTTP_STATUS.CREATED,
      { mood: response },
      riskAnalysis.level === 'HIGH_RISK' 
        ? 'Mood added. Emergency contacts have been notified.'
        : 'Mood added'
    )
  );
});

export const getMoodHistory = asyncHandler(async (req, res) => {
  const { from, to } = req.query;
  const userId = req.user.id;

  const filter = { userId };

  const fromDate = from ? toUTCDateOnly(from) : null;
  const toDate = to ? toUTCDateOnly(to) : null;

  if (fromDate) filter.date = { ...(filter.date ?? {}), $gte: fromDate };
  if (toDate) filter.date = { ...(filter.date ?? {}), $lte: toDate };

  const moods = await Mood.find(filter)
    .select('-userId')
    .sort({ date: -1, createdAt: -1 })
    .lean();

  const formatted = moods.map((m) => ({
    ...m,
    date: formatDateOnly(m.date),
  }));

  res.json(new ApiResponse(HTTP_STATUS.OK, { moods: formatted }, 'Mood history retrieved'));
});

export const updateMood = asyncHandler(async (req, res) => {
  const { mood, keyword, description } = req.body;
  const { date } = req.params;

  const dateOnly = parseDateParamOrBody({ paramDate: date });
  if (!dateOnly) throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Invalid date');

  const userId = req.user.id;

  const moodEntry = await Mood.findOne({ userId, date: dateOnly });
  if (!moodEntry) throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Mood entry not found for this date');

  moodEntry.mood = mood;
  moodEntry.keyword = keyword;
  moodEntry.description = description;
  await moodEntry.save();

  const response = moodEntry.toObject();
  response.date = formatDateOnly(response.date);
  delete response.userId;

  res.json(new ApiResponse(HTTP_STATUS.OK, { mood: response }, 'Mood updated'));
});

export const deleteMood = asyncHandler(async (req, res) => {
  const { date } = req.params;
  const dateOnly = parseDateParamOrBody({ paramDate: date });
  if (!dateOnly) throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Invalid date');

  const userId = req.user.id;

  const deleted = await Mood.findOneAndDelete({ userId, date: dateOnly }).select('-userId').lean();
  if (!deleted) throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Mood entry not found for this date');

  deleted.date = formatDateOnly(deleted.date);

  res.json(new ApiResponse(HTTP_STATUS.OK, { mood: deleted }, 'Mood deleted'));
});

export const getAllMoods = asyncHandler(async (_req, res) => {
  const moods = await Mood.find({})
    .select('userId mood keyword date')
    .sort({ createdAt: -1 })
    .lean();

  const formatted = moods.map((m) => ({
    ...m,
    date: formatDateOnly(m.date),
  }));

  res.json(new ApiResponse(HTTP_STATUS.OK, { moods: formatted }, 'All moods retrieved'));
});

