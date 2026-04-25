import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import ApiError from '../utils/ApiError.js';
import Mood from '../models/Mood.js';
import Goal from '../models/Goal.js';
import { HTTP_STATUS } from '../config/constants.js';
import PDFDocument from 'pdfkit';

const parseISODateOnly = (s) => {
  if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const [y, m, d] = s.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (Number.isNaN(dt.getTime())) return null;
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) return null;
  return dt;
};

const getTodayUTCDateOnly = () => {
  const t = new Date();
  return new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), t.getUTCDate()));
};

const formatDateOnly = (d) => {
  if (!d) return 'N/A';
  return new Date(d).toISOString().slice(0, 10);
};

const moodRecommendationMap = (mood) => {
  const m = String(mood ?? '').toLowerCase();

  if (['pressure', 'stress', 'anxious'].includes(m)) {
    return {
      shortRecommendation: 'Focus on calming and supportive activities to reduce stress load.',
      suggestedActivities: [
        '5-minute breathing exercise',
        'Short guided meditation',
        '10-15 minute walk',
        'Journaling for thought release',
        'Relaxing music break',
      ],
      stylePhrase: 'calming and supportive activities',
    };
  }

  if (m === 'positive') {
    return {
      shortRecommendation: 'Maintain your current healthy routine and reinforce positive habits.',
      suggestedActivities: [
        'Gratitude journaling',
        'Regular exercise sessions',
        'Keep a consistent sleep routine',
        'Continue productive daily planning',
        'Celebrate small wins',
      ],
      stylePhrase: 'consistency and growth activities',
    };
  }

  if (['low', 'sad'].includes(m)) {
    return {
      shortRecommendation: 'Use gentle self-care and connection-focused activities to improve mood.',
      suggestedActivities: [
        'Light physical activity',
        'Talk to a trusted person',
        'Take restorative rest',
        'Mood journaling',
        'Simple self-care routine',
      ],
      stylePhrase: 'gentle self-care activities',
    };
  }

  return {
    shortRecommendation: 'Keep a balanced routine and monitor mood changes regularly.',
    suggestedActivities: [
      'Daily check-in reflection',
      'Light movement',
      'Hydration and sleep consistency',
      'Mindfulness pause',
      'Goal review and planning',
    ],
    stylePhrase: 'balanced wellness activities',
  };
};

const buildReportData = async ({ userId, start, end }) => {
  const [moods, goals] = await Promise.all([
    Mood.find({ userId, date: { $gte: start, $lte: end } }).lean(),
    Goal.find({ userId, date: { $gte: start, $lte: end } }).lean(),
  ]);

  const moodCounts = moods.reduce((acc, m) => {
    const key = m?.mood ?? 'Unknown';
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  const mostCommonMood = Object.entries(moodCounts)
    .sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'N/A';

  const dateSet = new Set([
    ...moods.map((m) => formatDateOnly(m.date)),
    ...goals.map((g) => formatDateOnly(g.date)),
  ]);
  const totalTrackedDays = dateSet.size;

  const stressMoods = moods
    .filter((m) => ['pressure', 'stress', 'anxious'].includes(String(m.mood ?? '').toLowerCase()))
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  const stressDays = new Set(stressMoods.map((m) => formatDateOnly(m.date))).size;
  const lastStressDay = stressMoods.length > 0 ? formatDateOnly(stressMoods[stressMoods.length - 1].date) : 'N/A';
  const stressPercentage = totalTrackedDays > 0 ? Number(((stressDays / totalTrackedDays) * 100).toFixed(1)) : 0;

  const missedGoals = goals.filter((g) => g.status === 'incomplete');
  const missingGoals = missedGoals.length;

  const missedCounts = missedGoals.reduce((acc, g) => {
    const key = String(g.goalName ?? '').trim().toLowerCase();
    if (!key) return acc;
    acc[key] = { count: (acc[key]?.count ?? 0) + 1, label: String(g.goalName ?? '').trim() };
    return acc;
  }, {});
  const mostMissedGoal = Object.values(missedCounts).sort((a, b) => b.count - a.count)[0]?.label ?? 'N/A';

  const recommendation = moodRecommendationMap(mostCommonMood);

  const dateRangeSummary = `From ${formatDateOnly(start)} to ${formatDateOnly(end)}, your mood and goal data show patterns that can help guide your next steps.`;
  const topSummary = `During this selected period, your most common mood was ${mostCommonMood}. Stress was recorded on ${stressDays} day${stressDays !== 1 ? 's' : ''}, and ${missingGoals} goal${missingGoals !== 1 ? 's were' : ' was'} missed. Based on your mood pattern, we recommend ${recommendation.stylePhrase}.`;

  return {
    overview: {
      mostCommonMood,
      totalTrackedDays,
      stressDays,
      lastStressDay,
      stressPercentage,
      missingGoals,
      mostMissedGoal,
      shortRecommendation: recommendation.shortRecommendation,
      suggestedActivities: recommendation.suggestedActivities,
      dateRangeSummary,
      topSummary,
      startDate: formatDateOnly(start),
      endDate: formatDateOnly(end),
    },
  };
};

export const getAnalyticsSummary = asyncHandler(async (req, res) => {
  // Use ObjectId for reliable $match in aggregation.
  const userId = req.user._id;

  const today = new Date();
  // Midnight UTC boundary for "today"
  const startOfTodayUTC = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())
  );

  const [mostCommonMoodAgg, stressCount, moodCounts, missingGoalsCount] = await Promise.all([
    Mood.aggregate([
      { $match: { userId } },
      { $group: { _id: '$mood', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 },
    ]),
    Mood.countDocuments({ userId, mood: 'Pressure' }),
    Mood.aggregate([
      { $match: { userId } },
      { $group: { _id: '$mood', count: { $sum: 1 } } },
    ]),
    // Missing = incomplete AND strictly before today (UTC)
    Goal.countDocuments({ userId, status: 'incomplete', date: { $lt: startOfTodayUTC } }),
  ]);

  const mostCommonMood = mostCommonMoodAgg?.[0]?._id ?? null;

  const moodOrder = ['Positive', 'Stable', 'Pressure', 'Low'];
  const totalMoods = (moodCounts ?? []).reduce((sum, r) => sum + (r?.count ?? 0), 0);
  const moodDistribution = moodOrder.map((mood) => {
    const found = (moodCounts ?? []).find((r) => r?._id === mood);
    const count = found?.count ?? 0;
    const percent = totalMoods > 0 ? (count / totalMoods) * 100 : 0; // one decimal
    return { mood, count, percent };
  });

  res.json(
    new ApiResponse(
      HTTP_STATUS.OK,
      {
        mostCommonMood,
        stressCount,
        missingGoalsCount,
        moodDistribution,
      },
      'Analytics summary retrieved'
    )
  );
});

/** Validates report date range and checks mood/goal rows in range (for PDF / download gating). */
export const checkReportRange = asyncHandler(async (req, res) => {
  const { startDate: startStr, endDate: endStr } = req.query;

  if (!startStr || !endStr) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Start date and end date are required');
  }//Required Fields Check

  const start = parseISODateOnly(startStr);
  const end = parseISODateOnly(endStr);
  if (!start || !end) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Invalid date format');
  } //End Date stops so that it cannot be set one day earlier than the Start Date.//

  if (start > end) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Start date must be before or equal to end date');
  } //Future Date Validation

  const today = getTodayUTCDateOnly();
  if (start > today || end > today) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Dates cannot be in the future');
  }

  const userId = req.user._id;

  const [moodCount, goalCount] = await Promise.all([
    Mood.countDocuments({ userId, date: { $gte: start, $lte: end } }),
    Goal.countDocuments({ userId, date: { $gte: start, $lte: end } }),
  ]);

  const hasData = moodCount > 0 || goalCount > 0;

  res.json(
    new ApiResponse(
      HTTP_STATUS.OK,
      { hasData, moodCount, goalCount },
      hasData ? 'Data available for selected period' : 'No data for selected period'
    )
  );
});

export const downloadAnalyticsReport = asyncHandler(async (req, res) => {
  const { startDate: startStr, endDate: endStr } = req.query;

  if (!startStr || !endStr) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Start date and end date are required');
  }

  const start = parseISODateOnly(startStr);
  const end = parseISODateOnly(endStr);
  if (!start || !end) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Invalid date format');
  }
  if (start > end) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Start date must be before or equal to end date');
  }

  const today = getTodayUTCDateOnly();
  if (start > today || end > today) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Dates cannot be in the future');
  }

  const report = await buildReportData({ userId: req.user._id, start, end });
  const o = report.overview;

  if (o.totalTrackedDays === 0) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'No data found for the selected period');
  }

  const filename = `mindmate-report-${o.startDate}-to-${o.endDate}.pdf`;
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

  const doc = new PDFDocument({ margin: 48, size: 'A4' });
  doc.pipe(res);

  const pageW = doc.page.width;
  const contentW = pageW - doc.page.margins.left - doc.page.margins.right;
  const left = doc.page.margins.left;
  const right = left + contentW;
  const generatedDate = new Date().toISOString().slice(0, 10);

  // Header band
  doc.roundedRect(left, 40, contentW, 76, 12).fill('#eef6ff');
  doc.roundedRect(left, 40, contentW, 76, 12).strokeColor('#bfdbfe').lineWidth(1).stroke();
  doc.fillColor('#0f172a').fontSize(22).text('MindMate Report', left + 16, 58);
  doc.fillColor('#334155').fontSize(11).text('Personal Tracking Summary', left + 16, 86);

  // Date/meta row
  doc.fillColor('#475569').fontSize(10);
  doc.text(`Selected Range: ${o.startDate} to ${o.endDate}`, left, 128);
  doc.text(`Generated On: ${generatedDate}`, left, 143);

  // Highlight summary box
  doc.roundedRect(left, 166, contentW, 78, 10).fill('#f8fafc');
  doc.roundedRect(left, 166, contentW, 78, 10).strokeColor('#e2e8f0').lineWidth(1).stroke();
  doc.fillColor('#0f172a').fontSize(12).text('Summary', left + 14, 178);
  doc.fillColor('#334155').fontSize(10.5).text(o.topSummary, left + 14, 196, { width: contentW - 28 });

  // Metric cards
  const gap = 10;
  const cardW = (contentW - gap * 3) / 4;
  const cardY = 258;
  const drawMetricCard = (x, title, value) => {
    doc.roundedRect(x, cardY, cardW, 68, 8).fill('#ffffff');
    doc.roundedRect(x, cardY, cardW, 68, 8).strokeColor('#e2e8f0').lineWidth(1).stroke();
    doc.fillColor('#64748b').fontSize(9).text(title, x + 10, cardY + 11, { width: cardW - 20 });
    doc.fillColor('#0f172a').fontSize(14).text(String(value), x + 10, cardY + 31, { width: cardW - 20 });
  };
  drawMetricCard(left, 'Most Common Mood', o.mostCommonMood);
  drawMetricCard(left + cardW + gap, 'Tracked Days', o.totalTrackedDays);
  drawMetricCard(left + (cardW + gap) * 2, 'Stress %', `${o.stressPercentage}%`);
  drawMetricCard(left + (cardW + gap) * 3, 'Missing Goals', o.missingGoals);

  // Section heading helper
  const sectionTitle = (y, title) => {
    doc.fillColor('#0f172a').fontSize(13).text(title, left, y);
    doc.moveTo(left, y + 18).lineTo(right, y + 18).strokeColor('#e2e8f0').lineWidth(1).stroke();
  };

  // Structured overview block
  sectionTitle(344, 'Overview');
  doc.roundedRect(left, 368, contentW, 106, 8).fill('#ffffff');
  doc.roundedRect(left, 368, contentW, 106, 8).strokeColor('#e2e8f0').lineWidth(1).stroke();
  const rows = [
    ['Stress days', o.stressDays, 'Last stress day', o.lastStressDay],
    ['Most missed goal', o.mostMissedGoal, 'Date range summary', o.dateRangeSummary],
  ];
  let rowY = 382;
  rows.forEach(([l1, v1, l2, v2]) => {
    doc.fillColor('#64748b').fontSize(9).text(l1, left + 12, rowY);
    doc.fillColor('#0f172a').fontSize(10.5).text(String(v1), left + 12, rowY + 13, { width: contentW * 0.44 });
    doc.fillColor('#64748b').fontSize(9).text(l2, left + contentW * 0.52, rowY);
    doc.fillColor('#0f172a').fontSize(10.5).text(String(v2), left + contentW * 0.52, rowY + 13, { width: contentW * 0.42 });
    rowY += 45;
  });

  // Recommendation callout
  sectionTitle(490, 'Recommendation');
  doc.roundedRect(left, 514, contentW, 46, 8).fill('#ecfeff');
  doc.roundedRect(left, 514, contentW, 46, 8).strokeColor('#a5f3fc').lineWidth(1).stroke();
  doc.fillColor('#0f172a').fontSize(10.5).text(o.shortRecommendation, left + 12, 530, { width: contentW - 24 });

  // Suggested activities
  sectionTitle(576, 'Suggested Activities');
  doc.roundedRect(left, 600, contentW, 108, 8).fill('#ffffff');
  doc.roundedRect(left, 600, contentW, 108, 8).strokeColor('#e2e8f0').lineWidth(1).stroke();
  let ay = 614;
  o.suggestedActivities.forEach((activity, idx) => {
    doc.circle(left + 14, ay + 5, 2.2).fill('#0284c7');
    doc.fillColor('#334155').fontSize(10.5).text(`${idx + 1}. ${activity}`, left + 24, ay - 1, { width: contentW - 34 });
    ay += 19;
  });

  // Footer note strip
  doc.roundedRect(left, 724, contentW, 28, 6).fill('#f8fafc');
  doc.roundedRect(left, 724, contentW, 28, 6).strokeColor('#e2e8f0').lineWidth(1).stroke();
  doc.fillColor('#64748b').fontSize(9).text(
    'Generated from your mood and goal tracking data for self-reflection support.',
    left + 10,
    734,
    { width: contentW - 20, align: 'center' }
  );

  doc.end();
});

