import { format } from 'date-fns';
import { CalendarDays, CheckCircle, Clock, Edit3, Trash2 } from 'lucide-react';

const Card = ({ variant, extraClassName, children }) => {
  const styles = {
    complete: 'bg-green-50 border-green-200',
    missed: 'bg-red-50 border-red-200',
    pending: 'bg-gray-50 border-gray-200',
  };

  return (
    <div
      className={`
        rounded-2xl border shadow-sm p-5 transition-all duration-200 hover:shadow-md
        ${styles[variant] ?? styles.pending}
        ${extraClassName ?? ''}
      `}
    >
      {children}
    </div>
  );
};

const MiniDots = ({ filledCount, totalDots }) => {
  const target = Math.max(1, totalDots ?? 1);
  const count = Math.max(0, Math.min(target, filledCount ?? 0));
  return (
    <div className="flex gap-1.5 mt-2" aria-label={`Weekly progress: ${count}/${target}`}>
      {Array.from({ length: target }).map((_, i) => (
        <span
          key={`dot-${i}`}
          className={`
            w-2.5 h-2.5 rounded-full transition-all duration-200
            ${i < count ? 'bg-green-500' : 'bg-gray-200'}
          `}
        />
      ))}
    </div>
  );
};

const MiniWeek = ({ days }) => {
  const d = Array.isArray(days) ? days.slice(0, 7) : [];
  const labels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  return (
    <div className="mt-2" aria-label="Weekly progress (Mon-Sun)">
      <div className="flex items-center justify-between text-[11px] text-gray-500 mb-1">
        <span className="font-semibold text-gray-600">This week</span>
        <span className="font-semibold text-primary-700">{d.filter(Boolean).length}/7</span>
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {Array.from({ length: 7 }).map((_, i) => {
          const done = Boolean(d[i]);
          return (
            <div key={`day-${i}`} className="flex flex-col items-center gap-1">
              <span className={`w-3 h-3 rounded-full ${done ? 'bg-green-500' : 'bg-gray-200'}`} />
              <span className="text-[10px] text-gray-400">{labels[i]}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default function GoalHistoryCards({ goals, weeklyProgressByGoal, onMarkComplete, onDelete, todayISO, onEdit }) {
  const latest = goals ?? [];
  const normalizeName = (s) =>
    String(s ?? '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ' ');

  return (
    <div>
      <div className="mb-4">
        <p className="text-xs font-bold uppercase tracking-wider text-primary-600">Goal History</p>
        <h3 className="text-xl font-bold text-gray-900 mt-1">Latest goal activity</h3>
        <p className="text-sm text-gray-500 mt-1">
          Track your progress on daily and weekly goals.
        </p>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4">
        {latest.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="text-4xl mb-3">🎯</div>
            <p className="text-gray-500 font-medium">No goals yet</p>
            <p className="text-sm text-gray-400 mt-1">Add a goal to start tracking your progress.</p>
          </div>
        ) : (
          latest.slice(0, 8).map((g) => {
            const isWeeklyGoal = g.goalType === 'weekly' || g.goalType === 'custom';
            const frequency = isWeeklyGoal
              ? (g.frequencyPerWeek ?? (g.goalType === 'custom' ? 3 : 1))
              : 1;
            const sessionsDone = isWeeklyGoal
              ? (g.completedSessions ?? (g.status === 'complete' ? frequency : 0))
              : (g.status === 'complete' ? 1 : 0);
            const isComplete = g.status === 'complete' || sessionsDone >= frequency;
            const isDueToday = String(g.date ?? '') === todayISO;
            const isMissed = !isComplete && String(g.date ?? '') < todayISO;
            const variant = isComplete ? 'complete' : isMissed ? 'missed' : 'pending';
            const dateText = g.date ? format(new Date(g.date), 'MMM d') : '—';

            const statusLine = isComplete
              ? `Completed on ${dateText}`
              : isMissed
                ? `Missed on ${dateText}`
                : 'Due Today';

            const badgeTextDynamic = `${frequency}x/week`;
            const badgeTooltip = `Target: ${frequency} time${frequency !== 1 ? 's' : ''} this week`;
            const filledDots = sessionsDone;
            const extraClassName = isWeeklyGoal ? 'border-l-4 border-blue-200' : '';
            const progressText = g.goalType === 'daily'
              ? `Today: ${Math.min(1, g.progress?.current ?? sessionsDone)}/1`
              : `This week: ${(g.progress?.current ?? sessionsDone)}/${frequency}`;

            const key = `${g.goalType}::${normalizeName(g.goalName)}`;
            const weeklyRow = weeklyProgressByGoal?.[key] ?? null;

            return (
              <Card key={g._id} variant={variant} extraClassName={extraClassName}>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      {isWeeklyGoal && (
                        <CalendarDays className="w-4 h-4 text-blue-600 flex-shrink-0" />
                      )}
                      <p className="font-semibold text-gray-900 truncate">{g.goalName}</p>
                      {isWeeklyGoal && (
                        <span
                          title={badgeTooltip}
                          className="inline-flex items-center rounded-full bg-blue-50 border border-blue-200 px-2 py-0.5 text-xs font-medium text-blue-700 whitespace-nowrap"
                        >
                          {badgeTextDynamic}
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600 mt-1 flex items-center gap-2">
                      {isDueToday && !isComplete && <Clock className="w-4 h-4 text-gray-500" />}
                      <span>{statusLine}</span>
                    </div>
                    <div className="text-xs font-semibold text-primary-700 mt-1">{progressText}</div>

                    {g.goalType === 'daily' && weeklyRow?.days && <MiniWeek days={weeklyRow.days} />}
                    {isWeeklyGoal && (
                      <MiniDots
                        filledCount={weeklyRow ? (weeklyRow.current ?? filledDots) : filledDots}
                        totalDots={weeklyRow ? (weeklyRow.target ?? frequency) : frequency}
                      />
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2">
                    <button
                      type="button"      //button validation
                      disabled={isComplete}
                      onClick={() => onMarkComplete?.(g._id)}
                      className={`
                        inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                        transition-all duration-200 hover:scale-105 active:scale-95
                        ${
                          isComplete
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-green-600 text-white hover:bg-green-700 shadow-sm'
                        }
                      `}
                    >
                      <CheckCircle className="w-4 h-4" />
                      Complete
                    </button>

                    <div className="flex items-center gap-2">
                      {onEdit && !isComplete && (
                        <button
                          type="button"
                          onClick={() => onEdit?.(g)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-all duration-200"
                        >
                          <Edit3 className="w-4 h-4" />
                          Edit
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => onDelete?.(g._id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition-all duration-200"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}