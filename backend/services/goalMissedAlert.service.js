/**
 * goalMissedAlert.service.js
 *
 * Scheduled job that detects missed goals and sends one email alert per goal.
 * Runs on two schedules:
 *   - Daily goals  : every day at 00:05 UTC (checks yesterday)
 *   - Weekly goals : every Monday at 00:10 UTC (checks last ISO week)
 *
 * Deduplication: Goal.missedAlertSentAt is set after the alert is sent.
 * A goal is only alerted once — if the field is already set, it is skipped.
 */

import cron from 'node-cron';
import Goal from '../models/Goal.js';
import User from '../models/User.model.js';
import { sendEmail } from '../utils/email.util.js';

// ─── date helpers ─────────────────────────────────────────────────────────────

const toUTCMidnight = (d) =>
  new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));

const formatDate = (d) => (d ? new Date(d).toISOString().slice(0, 10) : 'N/A');

/** Returns the Monday–Sunday range for the ISO week that contains `date` */
const getISOWeekRange = (date) => {
  const d = toUTCMidnight(date);
  const dow = d.getUTCDay() || 7; // 1=Mon … 7=Sun
  const monday = new Date(d);
  monday.setUTCDate(d.getUTCDate() - (dow - 1));
  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);
  return { start: monday, end: sunday };
};

// ─── email templates ──────────────────────────────────────────────────────────

const buildDailyMissedEmail = (userName, goalName, missedDate) => ({
  subject: `MindMate — Missed daily goal: "${goalName}"`,
  html: `
    <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px;border:1px solid #e5e7eb;border-radius:12px;">
      <h2 style="color:#0f172a;margin-bottom:4px;">Daily Goal Missed</h2>
      <p style="color:#64748b;font-size:14px;margin-top:0;">MindMate Personal Tracking</p>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0;" />
      <p style="color:#334155;">Hi <strong>${userName}</strong>,</p>
      <p style="color:#334155;">
        Your daily goal <strong>"${goalName}"</strong> was not completed on
        <strong>${missedDate}</strong>.
      </p>
      <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:14px 16px;margin:20px 0;">
        <p style="margin:0;color:#991b1b;font-size:14px;">
          🎯 Goal: <strong>${goalName}</strong><br/>
          📅 Missed date: <strong>${missedDate}</strong>
        </p>
      </div>
      <p style="color:#334155;">
        Don't worry — every day is a fresh start. Add the goal again today to keep your streak going!
      </p>
      <p style="color:#64748b;font-size:13px;margin-top:24px;">— The MindMate Team</p>
    </div>
  `,
  text: `Hi ${userName},\n\nYour daily goal "${goalName}" was not completed on ${missedDate}.\n\nDon't worry — every day is a fresh start!\n\n— The MindMate Team`,
});

const buildWeeklyMissedEmail = (userName, goalName, goalType, completed, target, weekStart, weekEnd) => {
  const typeLabel = goalType === 'custom' ? `${target}x/week` : 'Weekly';
  const subject = `MindMate — Missed ${typeLabel.toLowerCase()} goal: "${goalName}"`;
  const html = `
    <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px;border:1px solid #e5e7eb;border-radius:12px;">
      <h2 style="color:#0f172a;margin-bottom:4px;">${typeLabel} Goal Missed</h2>
      <p style="color:#64748b;font-size:14px;margin-top:0;">MindMate Personal Tracking</p>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0;" />
      <p style="color:#334155;">Hi <strong>${userName}</strong>,</p>
      <p style="color:#334155;">
        Your ${typeLabel.toLowerCase()} goal <strong>"${goalName}"</strong> was not fully completed
        for the week of <strong>${weekStart} → ${weekEnd}</strong>.
      </p>
      <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:14px 16px;margin:20px 0;">
        <p style="margin:0;color:#991b1b;font-size:14px;">
          🎯 Goal: <strong>${goalName}</strong><br/>
          📊 Progress: <strong>${completed} / ${target}</strong> sessions completed<br/>
          📅 Week: <strong>${weekStart} → ${weekEnd}</strong>
        </p>
      </div>
      <p style="color:#334155;">
        A new week has started — add the goal again and aim for the full target!
      </p>
      <p style="color:#64748b;font-size:13px;margin-top:24px;">— The MindMate Team</p>
    </div>
  `;
  const text = `Hi ${userName},\n\nYour ${typeLabel.toLowerCase()} goal "${goalName}" was not fully completed for the week of ${weekStart} → ${weekEnd}.\nProgress: ${completed}/${target} sessions.\n\nA new week has started — keep going!\n\n— The MindMate Team`;
  return { subject, html, text };
};

// ─── detection + alert logic ──────────────────────────────────────────────────

/**
 * Check daily goals from yesterday that are still incomplete and have not
 * had an alert sent yet.
 */
const processDailyMissed = async () => {
  const now = new Date();
  const yesterday = toUTCMidnight(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 1)));

  const missed = await Goal.find({
    goalType: 'daily',
    status: 'incomplete',
    date: yesterday,
    missedAlertSentAt: null,
  }).lean();

  if (!missed.length) return;

  // Group by userId to batch-fetch users
  const userIds = [...new Set(missed.map((g) => String(g.userId)))];
  const users = await User.find({ _id: { $in: userIds } }).select('email name').lean();
  const userMap = Object.fromEntries(users.map((u) => [String(u._id), u]));

  for (const goal of missed) {
    const user = userMap[String(goal.userId)];
    if (!user?.email) continue;

    const missedDate = formatDate(goal.date);
    const { subject, html, text } = buildDailyMissedEmail(user.name ?? 'there', goal.goalName, missedDate);

    await sendEmail({ to: user.email, subject, html, text });

    // Mark alert sent — prevents re-sending on next cron run
    await Goal.updateOne({ _id: goal._id }, { $set: { missedAlertSentAt: new Date() } });

    console.log(`[goalMissedAlert] Daily alert sent → ${user.email} | goal: "${goal.goalName}" | date: ${missedDate}`);
  }
};

/**
 * Check weekly/custom goals from last ISO week that are still incomplete
 * and have not had an alert sent yet.
 */
const processWeeklyMissed = async () => {
  const now = new Date();
  // "Last week" = the ISO week that ended yesterday (Sunday)
  const yesterday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 1));
  const { start: weekStart, end: weekEnd } = getISOWeekRange(yesterday);

  const missed = await Goal.find({
    goalType: { $in: ['weekly', 'custom'] },
    status: 'incomplete',
    date: { $gte: weekStart, $lte: weekEnd },
    missedAlertSentAt: null,
  }).lean();

  if (!missed.length) return;

  const userIds = [...new Set(missed.map((g) => String(g.userId)))];
  const users = await User.find({ _id: { $in: userIds } }).select('email name').lean();
  const userMap = Object.fromEntries(users.map((u) => [String(u._id), u]));

  for (const goal of missed) {
    const user = userMap[String(goal.userId)];
    if (!user?.email) continue;

    const target = goal.frequencyPerWeek ?? (goal.goalType === 'custom' ? 3 : 1);
    const completed = goal.completedSessions ?? 0;
    const ws = formatDate(weekStart);
    const we = formatDate(weekEnd);

    const { subject, html, text } = buildWeeklyMissedEmail(
      user.name ?? 'there',
      goal.goalName,
      goal.goalType,
      completed,
      target,
      ws,
      we
    );

    await sendEmail({ to: user.email, subject, html, text });
    await Goal.updateOne({ _id: goal._id }, { $set: { missedAlertSentAt: new Date() } });

    console.log(`[goalMissedAlert] Weekly alert sent → ${user.email} | goal: "${goal.goalName}" | week: ${ws}→${we}`);
  }
};

// ─── cron registration ────────────────────────────────────────────────────────

export const registerGoalMissedAlertJobs = () => {
  // Daily missed goals — runs every day at 00:05 UTC
  cron.schedule('5 0 * * *', async () => {
    console.log('[goalMissedAlert] Running daily missed-goal check…');
    try {
      await processDailyMissed();
    } catch (err) {
      console.error('[goalMissedAlert] Daily check error:', err.message);
    }
  }, { timezone: 'UTC' });

  // Weekly/custom missed goals — runs every Monday at 00:10 UTC
  // (Monday 00:10 UTC = just after the Sunday that ended the previous ISO week)
  cron.schedule('10 0 * * 1', async () => {
    console.log('[goalMissedAlert] Running weekly missed-goal check…');
    try {
      await processWeeklyMissed();
    } catch (err) {
      console.error('[goalMissedAlert] Weekly check error:', err.message);
    }
  }, { timezone: 'UTC' });

  console.log('[goalMissedAlert] Missed-goal alert jobs registered ✓');
};
