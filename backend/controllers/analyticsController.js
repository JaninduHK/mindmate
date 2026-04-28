import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import Mood from '../models/Mood.js';
import Goal from '../models/Goal.js';
import PDFDocument from 'pdfkit';
import { HTTP_STATUS } from '../config/constants.js';

// Get analytics summary for a user
export const getAnalyticsSummary = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { startDate, endDate } = req.query;

  const query = { userId };
  if (startDate || endDate) {
    query.date = {};
    if (startDate) query.date.$gte = new Date(startDate);
    if (endDate) query.date.$lte = new Date(endDate);
  }

  // Fetch moods
  const moods = await Mood.find(query).sort({ date: -1 });

  // Calculate mood distribution
  const moodCounts = {};
  moods.forEach(mood => {
    const moodType = mood.mood || 'unknown';
    moodCounts[moodType] = (moodCounts[moodType] || 0) + 1;
  });

  // Convert to array format for charts
  const moodDistribution = Object.entries(moodCounts).map(([mood, count]) => ({
    mood,
    count,
  }));

  // Get most common mood
  const mostCommonMood =
    moodDistribution.length > 0
      ? moodDistribution.reduce((prev, current) => (prev.count > current.count ? prev : current)).mood
      : 'N/A';

  // Fetch goals with date filter
  const goalQuery = { userId };
  if (startDate || endDate) {
    goalQuery.createdAt = {};
    if (startDate) goalQuery.createdAt.$gte = new Date(startDate);
    if (endDate) goalQuery.createdAt.$lte = new Date(endDate);
  }

  const goals = await Goal.find(goalQuery);

  // Calculate goal summary by status
  const goalStatusCounts = {};
  goals.forEach(goal => {
    const status = goal.status || 'incomplete';
    goalStatusCounts[status] = (goalStatusCounts[status] || 0) + 1;
  });

  // Convert to array format for charts
  const goalSummary = Object.entries(goalStatusCounts).map(([status, count]) => ({
    _id: status,
    count,
  }));

  res.json(
    new ApiResponse(HTTP_STATUS.OK, {
      mostCommonMood,
      moodDistribution,
      goalSummary,
    })
  );
});

// Check if report can be generated for date range
export const checkReportRange = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    return res.json(
      new ApiResponse(HTTP_STATUS.BAD_REQUEST, {}, 'startDate and endDate are required')
    );
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (start > end) {
    return res.json(
      new ApiResponse(HTTP_STATUS.BAD_REQUEST, {}, 'startDate must be before endDate')
    );
  }

  const moodCount = await Mood.countDocuments({
    userId,
    date: { $gte: start, $lte: end },
  });

  res.json(
    new ApiResponse(HTTP_STATUS.OK, {
      canGenerateReport: moodCount > 0,
      moodEntriesInRange: moodCount,
    })
  );
});

// Download analytics report as PDF
export const downloadAnalyticsReport = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { startDate, endDate } = req.query;

  const query = { userId };
  if (startDate || endDate) {
    query.date = {};
    if (startDate) query.date.$gte = new Date(startDate);
    if (endDate) query.date.$lte = new Date(endDate);
  }

  const moods = await Mood.find(query).sort({ date: -1 });
  const goals = await Goal.find({ userId });

  // Calculate mood statistics
  const moodCounts = {};
  moods.forEach(mood => {
    moodCounts[mood.mood] = (moodCounts[mood.mood] || 0) + 1;
  });

  // Calculate goal statistics
  const completed = goals.filter(g => g.status === 'complete').length;
  const inProgress = goals.filter(g => g.status === 'incomplete').length;

  // Create PDF
  const doc = new PDFDocument();

  // Set response headers
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename="analytics-report.pdf"');

  doc.pipe(res);

  // Add content
  doc.fontSize(20).text('Analytics Report', 50, 50);
  doc.fontSize(12).text(`Generated: ${new Date().toLocaleDateString()}`, 50, 80);

  // Mood section
  doc.fontSize(14).text('Mood Tracking', 50, 120);
  doc.fontSize(11);
  let yPosition = 145;
  Object.keys(moodCounts).forEach(mood => {
    doc.text(`${mood}: ${moodCounts[mood]} entries`, 50, yPosition);
    yPosition += 20;
  });

  // Goals section
  doc.fontSize(14).text('Goals Progress', 50, yPosition + 20);
  doc.fontSize(11);
  doc.text(`Total Goals: ${goals.length}`, 50, yPosition + 45);
  doc.text(`Completed: ${completed}`, 50, yPosition + 65);
  doc.text(`In Progress: ${inProgress}`, 50, yPosition + 85);

  doc.end();
});