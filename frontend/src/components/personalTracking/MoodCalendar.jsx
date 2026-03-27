import { useMemo } from 'react';
import { Trash2 } from 'lucide-react';
import { eachDayOfInterval, endOfMonth, endOfWeek, format, isSameDay, isSameMonth, startOfMonth, startOfWeek } from 'date-fns';

const MOOD_UI = {
  Positive: { emoji: '😊', bg: 'bg-green-500', text: 'text-white' },
  Stable: { emoji: '😐', bg: 'bg-yellow-500', text: 'text-gray-900' },
  Pressure: { emoji: '😣', bg: 'bg-orange-500', text: 'text-white' },
  Low: { emoji: '😔', bg: 'bg-red-500', text: 'text-white' },
};

const MOOD_BORDER = {
  Positive: 'border-green-500',
  Stable: 'border-yellow-500',
  Pressure: 'border-orange-500',
  Low: 'border-red-500',
};

const formatDateOnly = (isoDate) => {
  if (!isoDate) return '';
  const s = String(isoDate);
  return s.length >= 10 ? s.slice(0, 10) : new Date(s).toISOString().slice(0, 10);
};

export default function MoodCalendar({
  monthCursor,
  onMonthChange,
  moods,
  selectedDate,
  onSelectDate,
  todayISO,
  selectedMood,
  onDeleteSelectedMood,
  deleting = false,
}) {
  const monthStart = useMemo(() => startOfMonth(monthCursor), [monthCursor]);
  const monthEnd = useMemo(() => endOfMonth(monthCursor), [monthCursor]);
  const gridStart = useMemo(() => startOfWeek(monthStart, { weekStartsOn: 1 }), [monthStart]);
  const gridEnd = useMemo(() => endOfWeek(monthEnd, { weekStartsOn: 1 }), [monthEnd]);

  const days = useMemo(() => eachDayOfInterval({ start: gridStart, end: gridEnd }), [gridStart, gridEnd]);

  const moodsByDate = useMemo(() => {
    const map = new Map();
    (moods ?? []).forEach((m) => {
      if (!m?.date) return;
      map.set(formatDateOnly(m.date), m);
    });
    return map;
  }, [moods]);

  const weeks = useMemo(() => {
    const out = [];
    for (let i = 0; i < days.length; i += 7) out.push(days.slice(i, i + 7));
    return out;
  }, [days]);

  const handlePrevMonth = () => {
    const d = new Date(monthCursor);
    d.setMonth(d.getMonth() - 1);
    onMonthChange(d);
  };

  const handleNextMonth = () => {
    const d = new Date(monthCursor);
    d.setMonth(d.getMonth() + 1);
    onMonthChange(d);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-shadow hover:shadow-md">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 border-b border-gray-100">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-primary-600">Calendar</p>
            <h3 className="text-xl font-bold text-gray-900 mt-1">
              {format(monthCursor, 'MMMM yyyy')}
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
            >
              ← Prev
            </button>
            <button
              type="button"
              onClick={() => onMonthChange(new Date())}
              className="px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
            >
              Today
            </button>
            <button
              type="button"
              onClick={handleNextMonth}
              className="px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
            >
              Next →
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Calendar Grid */}
          <div className="lg:col-span-3">
            {/* Weekday Headers */}
            <div className="grid grid-cols-7 gap-2 mb-3 text-center">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
                <div key={d} className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                  {d}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="space-y-2">
              {weeks.map((week, weekIdx) => (
                <div key={weekIdx} className="grid grid-cols-7 gap-2">
                  {week.map((day) => {
                    const iso = format(day, 'yyyy-MM-dd');
                    const mood = moodsByDate.get(iso) || null;
                    const ui = mood ? MOOD_UI[mood.mood] : null;
                    const inMonth = isSameMonth(day, monthCursor);
                    const isSelected = isSameDay(day, new Date(selectedDate));
                    const isToday = iso === todayISO;
                    const isFuture = iso > todayISO;

                    // Determine styles
                    let dayClasses = `
                      relative flex flex-col items-center justify-center
                      h-14 w-full rounded-xl transition-all duration-200
                      ${!inMonth ? 'opacity-40' : ''}
                      ${isFuture ? 'cursor-not-allowed opacity-35' : 'cursor-pointer hover:bg-gray-50'}
                    `;

                    if (isSelected) {
                      if (mood) {
                        dayClasses += ` ring-2 ring-offset-1 ${MOOD_BORDER[mood.mood] || 'ring-primary-500'}`;
                      } else {
                        dayClasses += ' ring-2 ring-primary-500 ring-offset-1';
                      }
                    } else if (isToday) {
                      dayClasses += ' ring-2 ring-primary-200 ring-offset-1';
                    }

                    return (
                      <button
                        key={iso}
                        type="button"
                        onClick={() => !isFuture && onSelectDate(iso)}
                        disabled={isFuture}
                        className={dayClasses}
                        aria-label={`Select ${iso}`}
                      >
                        <div className="flex flex-col items-center justify-center">
                          {mood ? (
                            <div
                              className={`
                                w-9 h-9 rounded-full ${ui.bg} ${ui.text}
                                flex items-center justify-center text-lg
                                shadow-sm transition-transform duration-200
                              `}
                            >
                              {ui.emoji}
                            </div>
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-300">
                              {/* Empty state */}
                            </div>
                          )}
                          <span
                            className={`
                              mt-1 text-xs font-medium
                              ${isToday ? 'text-primary-600 font-bold' : 'text-gray-500'}
                            `}
                          >
                            {format(day, 'd')}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Details Panel */}
          <div className="lg:col-span-2">
            <div className="bg-gray-50/50 rounded-xl p-5 border border-gray-100">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
                Selected Date
              </p>

              {selectedMood ? (
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div
                      className={`
                        w-12 h-12 rounded-full 
                        ${MOOD_UI[selectedMood.mood]?.bg ?? 'bg-gray-200'}
                        flex items-center justify-center text-2xl shadow-sm
                      `}
                    >
                      {MOOD_UI[selectedMood.mood]?.emoji ?? '🙂'}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-gray-900 text-lg capitalize">
                        {selectedMood.mood}
                      </p>
                      <p className="text-sm text-gray-600 mt-0.5">
                        <span className="font-semibold">Keyword:</span> {selectedMood.keyword}
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {selectedMood.description}
                    </p>
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => onDeleteSelectedMood?.(selectedDate)}
                      disabled={deleting}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-white hover:bg-red-50 text-red-600 border border-red-200 hover:border-red-300 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete Entry
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">📅</div>
                  <p className="text-sm text-gray-500">
                    No mood recorded for{' '}
                    <span className="font-semibold text-gray-700">{selectedDate}</span>
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Click on a date to view details
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}