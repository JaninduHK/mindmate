import { useCallback, useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import axiosInstance from '../../api/axios.config';
import toast from 'react-hot-toast';
import Loading from '../../components/common/Loading';

import MoodForm from '../../components/personalTracking/MoodForm';
import MoodCalendar from '../../components/personalTracking/MoodCalendar';

const wordCount = (s) =>
  String(s ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

const toMonthRange = (monthCursor) => {
  const startOfMonth = new Date(monthCursor.getFullYear(), monthCursor.getMonth(), 1);
  const endOfMonth = new Date(monthCursor.getFullYear(), monthCursor.getMonth() + 1, 0);
  return {
    from: format(startOfMonth, 'yyyy-MM-dd'),
    to: format(endOfMonth, 'yyyy-MM-dd'),
  };
};

export default function MoodPage() {
  const todayISO = useMemo(() => format(new Date(), 'yyyy-MM-dd'), []);

  const [monthCursor, setMonthCursor] = useState(new Date());
  const [monthMoods, setMonthMoods] = useState([]);
  const [todayMood, setTodayMood] = useState(null);
  const [loadingMonth, setLoadingMonth] = useState(true);
  const [loadingToday, setLoadingToday] = useState(true);
  const [selectedDate, setSelectedDate] = useState(todayISO);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const selectedMood = useMemo(() => monthMoods.find((m) => m.date === selectedDate) || null, [monthMoods, selectedDate]);
  const loading = loadingMonth || loadingToday;

  const refreshMonthMoods = useCallback(async (cursor = monthCursor) => {
    setLoadingMonth(true);
    try {
      const { from, to } = toMonthRange(cursor);
      const res = await axiosInstance.get('/personal-tracking/moods', { params: { from, to } });
      setMonthMoods(res.data?.data?.moods ?? []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load mood history');
    } finally {
      setLoadingMonth(false);
    }
  }, [monthCursor]);

  useEffect(() => {
    refreshMonthMoods();
  }, [refreshMonthMoods]);

  const refreshTodayMood = useCallback(async () => {
    setLoadingToday(true);
    try {
      const res = await axiosInstance.get('/personal-tracking/moods', {
        params: { from: todayISO, to: todayISO },
      });
      setTodayMood(res.data?.data?.moods?.[0] ?? null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load today mood');
    } finally {
      setLoadingToday(false);
    }
  }, [todayISO]);

  useEffect(() => {
    refreshTodayMood();
  }, [refreshTodayMood]);

  useEffect(() => {
    const from = toMonthRange(monthCursor).from;
    const to = toMonthRange(monthCursor).to;
    if (selectedDate < from || selectedDate > to) {
      const candidate = from;
      setSelectedDate(candidate > todayISO ? todayISO : candidate);
    }
  }, [monthCursor, selectedDate, todayISO]);

  const handleUpsertTodayMood = async ({ mood, keyword, description }) => {
    setSubmitting(true);
    try {
      const descriptionTrimmed = String(description ?? '').trim();
      const words = wordCount(descriptionTrimmed);
      if (words > 20) {
        toast.error('Word limit exceeded!');
        return;
      }

      if (todayMood) {
        await axiosInstance.put(`/personal-tracking/moods/${todayISO}`, {
          mood,
          keyword,
          description: descriptionTrimmed,
        });
        toast.success('Mood updated successfully! 🎉');
      } else {
        await axiosInstance.post('/personal-tracking/moods', {
          mood,
          keyword,
          description: descriptionTrimmed,
          date: todayISO,
        });
        toast.success('Mood saved successfully');
      }

      setMonthCursor(new Date());
      await refreshTodayMood();
      await refreshMonthMoods(new Date());
      setSelectedDate(todayISO);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save mood');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSelectedMood = async (dateISO) => {
    const iso = String(dateISO ?? '');
    if (!iso) return;
    if (iso > todayISO) return;

    setDeleting(true);
    try {
      await axiosInstance.delete(`/moods/${iso}`);
      toast.success('Entry deleted.');

      await refreshMonthMoods(monthCursor);
      await refreshTodayMood();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete mood entry');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="bg-white rounded-xl shadow-sm p-8">
          <Loading />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Mood Form Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-shadow hover:shadow-md">
          <div className="p-6">
            <div className="mb-6">
              <p className="text-xs font-bold uppercase tracking-wider text-primary-600">
                Daily check-in
              </p>
              <h2 className="text-2xl font-bold text-gray-900 mt-1">
                How are you feeling?
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                One entry per day. Updating today's mood will replace your previous entry.
              </p>
            </div>

            <MoodForm
              existingMood={todayMood}
              onSubmitUpsert={handleUpsertTodayMood}
              submitting={submitting}
            />
          </div>
        </div>

        {/* Mood Calendar Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-shadow hover:shadow-md">
          <div className="p-6">
            <div className="mb-6">
              <p className="text-xs font-bold uppercase tracking-wider text-primary-600">
                Mood history
              </p>
              <h2 className="text-2xl font-bold text-gray-900 mt-1">
                Your emotional timeline
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Click any date to view details and manage entries.
              </p>
            </div>

            <MoodCalendar
              monthCursor={monthCursor}
              onMonthChange={setMonthCursor}
              moods={monthMoods}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
              todayISO={todayISO}
              selectedMood={selectedMood}
              onDeleteSelectedMood={handleDeleteSelectedMood}
              deleting={deleting}
            />
          </div>
        </div>
      </div>
    </div>
  );
}