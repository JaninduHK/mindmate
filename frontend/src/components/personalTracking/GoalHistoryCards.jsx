import { format, differenceInCalendarDays, parseISO } from 'date-fns';
import { CalendarDays, CheckCircle, Clock, Edit3, Trash2, RefreshCw, Flame, Trophy } from 'lucide-react';

// ─── helpers ──────────────────────────────────────────────────────────────────

const normalizeName = (s) =>
  String(s ?? '').trim().toLowerCase().replace(/\s+/g, ' ');

/** Monday-anchored ISO week days for the week that contains todayISO */
const getWeekDays = (todayISO) => {
  const base = new Date(`${todayISO}T00:00:00Z`);
  const dow = base.getUTCDay() || 7; // 1=Mon … 7=Sun
  const monday = new Date(base);
  monday.setUTCDate(base.getUTCDate() - (dow - 1));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setUTCDate(monday.getUTCDate() + i);
    return d.toISOString().slice(0, 10);
  });
};

/**
 * Compute current streak and best streak from completionDates[].
 * Streak = consecutive calendar days going backwards from today.
 */
const computeStreaks = (completionDates, todayISO) => {
  if (!completionDates?.length) return { current: 0, best: 0, lastDone: null };

  const unique = [...new Set(completionDates.map((d) => String(d).slice(0, 10)))].sort();
  const lastDone = unique[unique.length - 1];

  // current streak — walk backwards from today
  let current = 0;
  const dateSet = new Set(unique);
  const cursor = new Date(`${todayISO}T00:00:00Z`);
  while (dateSet.has(cursor.toISOString().slice(0, 10))) {
    current++;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }

  // best streak — scan sorted unique dates
  let best = 0;
  let run = 1;
  for (let i = 1; i < unique.length; i++) {
    const diff =
      (new Date(`${unique[i]}T00:00:00Z`) - new Date(`${unique[i - 1]}T00:00:00Z`)) / 86400000;
    if (diff === 1) {
      run++;
      best = Math.max(best, run);
    } else {
      run = 1;
    }
  }
  best = Math.max(best, run, current);

  return { current, best, lastDone };
};

// ─── sub-components ───────────────────────────────────────────────────────────

const Card = ({ variant, extraClassName, children }) => {
  const styles = {
    complete: 'bg-green-50 border-green-200',
    missed: 'bg-red-50 border-red-200',
    pending: 'bg-gray-50 border-gray-200',
  };
  return (
    <div
      className={`rounded-2xl border shadow-sm p-5 transition-all duration-200 hover:shadow-md
        ${styles[variant] ?? styles.pending} ${extraClassName ?? ''}`}
    >
      {children}
    </div>
  );
};

/** Type badge — shown on every card */
const TypeBadge = ({ goalType }) => {
  const map = {
    daily:  { label: 'Daily',    cls: 'bg-violet-50 border-violet-200 text-violet-700' },
    weekly: { label: 'Weekly',   cls: 'bg-blue-50   border-blue-200   text-blue-700'   },
    custom: { label: '3x/week',  cls: 'bg-amber-50  border-amber-200  text-amber-700'  },
  };
  const { label, cls } = map[goalType] ?? map.daily;
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold whitespace-nowrap ${cls}`}>
      {label}
    </span>
  );
};

/**
 * Weekly dots for daily goals.
 * green = completed  |  red = missed (past, not done)  |  gray = not yet  |  blue ring = today
 */
const MiniWeek = ({ completionDates, todayISO }) => {
  const weekDays = getWeekDays(todayISO);
  const doneSet = new Set((completionDates ?? []).map((d) => String(d).slice(0, 10)));
  const labels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const completedCount = weekDays.filter((d) => doneSet.has(d)).length;

  return (
    <div className="mt-2" aria-label="Weekly progress (Mon-Sun)">
      <div className="flex items-center justify-between text-[11px] text-gray-500 mb-1">
        <span className="font-semibold text-gray-600">This week</span>
        <span className="font-semibold text-primary-700">{completedCount}/7</span>
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {weekDays.map((dayISO, i) => {
          const done    = doneSet.has(dayISO);
          const isToday = dayISO === todayISO;
          const isPast  = dayISO < todayISO;
          const missed  = isPast && !done;

          const dotCls = done ? 'bg-green-500' : missed ? 'bg-red-400' : 'bg-gray-200';

          return (
            <div key={dayISO} className="flex flex-col items-center gap-1">
              <span
                className={`w-3 h-3 rounded-full transition-all duration-200 ${dotCls}${
                  isToday ? ' ring-2 ring-blue-400 ring-offset-1' : ''
                }`}
              />
              <span className={`text-[10px] ${isToday ? 'text-blue-600 font-bold' : 'text-gray-400'}`}>
                {labels[i]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/** Session dots for weekly / custom goals */
const MiniDots = ({ filledCount, totalDots }) => {
  const target = Math.max(1, totalDots ?? 1);
  const count  = Math.max(0, Math.min(target, filledCount ?? 0));
  return (
    <div className="flex gap-1.5 mt-2" aria-label={`Weekly progress: ${count}/${target}`}>
      {Array.from({ length: target }).map((_, i) => (
        <span
          key={`dot-${i}`}
          className={`w-2.5 h-2.5 rounded-full transition-all duration-200 ${
            i < count ? 'bg-green-500' : 'bg-gray-200'
          }`}
        />
      ))}
    </div>
  );
};

// ─── main component ───────────────────────────────────────────────────────────

export default function GoalHistoryCards({
  goals,
  weeklyProgressByGoal,
  recurringCompletionDates,
  onMarkComplete,
  onDelete,
  todayISO,
  onEdit,
  onReactivate,
}) {
  const latest = goals ?? [];

  // ── empty state ──
  if (latest.length === 0) {
    return (
      <div>
        <div className="mb-4">
          <p className="text-xs font-bold uppercase tracking-wider text-primary-600">Goal History</p>
          <h3 className="text-xl font-bold text-gray-900 mt-1">Latest goal activity</h3>
          <p className="text-sm text-gray-500 mt-1">Track your progress on daily and weekly goals.</p>
        </div>
        <div className="text-center py-14 bg-white rounded-2xl border border-dashed border-gray-200 shadow-sm">
          <div className="text-5xl mb-3">🔍</div>
          <p className="text-gray-700 font-semibold text-base">No goals found for this filter</p>
          <p className="text-sm text-gray-400 mt-1">Try changing the status, type, or date range.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4">
        <p className="text-xs font-bold uppercase tracking-wider text-primary-600">Goal History</p>
        <h3 className="text-xl font-bold text-gray-900 mt-1">Latest goal activity</h3>
        <p className="text-sm text-gray-500 mt-1">Track your progress on daily and weekly goals.</p>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4">
        {latest.map((g) => {
          const isWeeklyGoal = g.goalType === 'weekly' || g.goalType === 'custom';
          const frequency = isWeeklyGoal
            ? (g.frequencyPerWeek ?? (g.goalType === 'custom' ? 3 : 1))
            : 1;

          // ── completion dates: use merged recurring history across all same-name docs ──
          const recurringKey = `${g.goalType}::${normalizeName(g.goalName)}`;
          // Fall back to the individual doc's completionDates if the map isn't provided
          const completionDates = recurringCompletionDates?.[recurringKey]
            ?? (Array.isArray(g.completionDates) ? g.completionDates : []);
          const doneSet = new Set(completionDates.map((d) => String(d).slice(0, 10)));
          const weekDays = getWeekDays(todayISO);

          // ── progress numbers ──
          const todayCurrent = doneSet.has(todayISO) ? 1 : 0;
          const todayTarget  = 1;
          const weekCurrent  = weekDays.filter((d) => doneSet.has(d)).length;
          const weekTarget   = g.goalType === 'daily' ? 7 : frequency;
          const weekPct      = weekTarget > 0 ? Math.round((weekCurrent / weekTarget) * 100) : 0;

          // ── streaks (daily only) ──
          const { current: currentStreak, best: bestStreak, lastDone } =
            g.goalType === 'daily'
              ? computeStreaks(completionDates, todayISO)
              : { current: 0, best: 0, lastDone: completionDates[completionDates.length - 1] ?? null };

          // ── status ──
          const sessionsDone = isWeeklyGoal
            ? (g.completedSessions ?? (g.status === 'complete' ? frequency : 0))
            : (g.status === 'complete' ? 1 : 0);
          const isComplete  = g.status === 'complete' || sessionsDone >= frequency;
          const isDueToday  = String(g.date ?? '') === todayISO;
          const isMissed    = !isComplete && String(g.date ?? '') < todayISO;
          const variant     = isComplete ? 'complete' : isMissed ? 'missed' : 'pending';

          // ── missed details ──
          let missedDaysAgo = null;
          let missedCountThisWeek = 0;
          if (isMissed) {
            const goalDateISO = String(g.date ?? '').slice(0, 10);
            if (goalDateISO) {
              missedDaysAgo = differenceInCalendarDays(parseISO(todayISO), parseISO(goalDateISO));
            }
            if (g.goalType === 'daily') {
              // past days this week that are not in doneSet
              missedCountThisWeek = weekDays.filter((d) => d < todayISO && !doneSet.has(d)).length;
            }
          }

          const dateText   = g.date ? format(new Date(g.date), 'MMM d') : '—';
          const statusLine = isComplete
            ? `Completed on ${dateText}`
            : isMissed
              ? `Missed on ${dateText}`
              : 'Due Today';

          const key       = `${g.goalType}::${normalizeName(g.goalName)}`;
          const weeklyRow = weeklyProgressByGoal?.[key] ?? null;
          const extraClassName = isWeeklyGoal ? 'border-l-4 border-blue-200' : '';

          return (
            <Card key={g._id} variant={variant} extraClassName={extraClassName}>
              <div className="flex flex-wrap items-start justify-between gap-4">

                {/* ── left: info ── */}
                <div className="flex-1 min-w-0">

                  {/* title + badges */}
                  <div className="flex flex-wrap items-center gap-2">
                    {isWeeklyGoal && <CalendarDays className="w-4 h-4 text-blue-600 flex-shrink-0" />}
                    <p className="font-semibold text-gray-900 truncate">{g.goalName}</p>
                    <TypeBadge goalType={g.goalType} />
                  </div>

                  {/* status line */}
                  <div className="text-sm text-gray-600 mt-1 flex items-center gap-2">
                    {isDueToday && !isComplete && <Clock className="w-4 h-4 text-gray-500" />}
                    <span>{statusLine}</span>
                  </div>

                  {/* progress numbers */}
                  <div className="flex flex-wrap gap-3 mt-1.5 text-xs font-semibold">
                    <span className="text-primary-700">Today: {todayCurrent}/{todayTarget}</span>
                    <span className="text-indigo-700">This week: {weekCurrent}/{weekTarget}</span>
                    <span className="text-teal-700">{weekPct}% this week</span>
                    {lastDone && (
                      <span className="text-gray-500 font-normal">
                        Last done: {format(parseISO(String(lastDone).slice(0, 10)), 'MMM d')}
                      </span>
                    )}
                  </div>

                  {/* streak — daily goals only */}
                  {g.goalType === 'daily' && (currentStreak > 0 || bestStreak > 0) && (
                    <div className="flex flex-wrap gap-3 mt-1.5 text-xs">
                      {currentStreak > 0 && (
                        <span className="inline-flex items-center gap-1 text-orange-600 font-semibold">
                          <Flame className="w-3.5 h-3.5" />
                          Current streak: {currentStreak} day{currentStreak !== 1 ? 's' : ''}
                        </span>
                      )}
                      {bestStreak > 0 && (
                        <span className="inline-flex items-center gap-1 text-yellow-600 font-semibold">
                          <Trophy className="w-3.5 h-3.5" />
                          Best: {bestStreak} day{bestStreak !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  )}

                  {/* missed extra info */}
                  {isMissed && (
                    <div className="mt-1.5 text-xs text-red-600 font-medium space-y-0.5">
                      {missedDaysAgo != null && missedDaysAgo > 0 && (
                        <p>Missed {missedDaysAgo} day{missedDaysAgo !== 1 ? 's' : ''} ago</p>
                      )}
                      {g.goalType === 'daily' && missedCountThisWeek > 0 && (
                        <p>Missed {missedCountThisWeek} time{missedCountThisWeek !== 1 ? 's' : ''} this week</p>
                      )}
                    </div>
                  )}

                  {/* weekly dots */}
                  {g.goalType === 'daily' && (
                    <MiniWeek completionDates={completionDates} todayISO={todayISO} />
                  )}
                  {isWeeklyGoal && (
                    <MiniDots
                      filledCount={weeklyRow ? (weeklyRow.current ?? sessionsDone) : sessionsDone}
                      totalDots={weeklyRow ? (weeklyRow.target ?? frequency) : frequency}
                    />
                  )}
                </div>

                {/* ── right: actions ── */}
                <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2">
                  <button
                    type="button"
                    disabled={isComplete}
                    onClick={() => onMarkComplete?.(g._id)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                      transition-all duration-200 hover:scale-105 active:scale-95
                      ${isComplete
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-green-600 text-white hover:bg-green-700 shadow-sm'
                      }`}
                  >
                    <CheckCircle className="w-4 h-4" />
                    Complete
                  </button>

                  {/* re-activate for missed goals */}
                  {isMissed && onReactivate && (
                    <button
                      type="button"
                      onClick={() => onReactivate(g._id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                        bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-100
                        transition-all duration-200"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Re-activate
                    </button>
                  )}

                  <div className="flex items-center gap-2">
                    {onEdit && !isComplete && (
                      <button
                        type="button"
                        onClick={() => onEdit(g)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                          bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100
                          transition-all duration-200"
                      >
                        <Edit3 className="w-4 h-4" />
                        Edit
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onDelete?.(g._id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                        bg-red-50 text-red-700 border border-red-200 hover:bg-red-100
                        transition-all duration-200"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </div>

              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
