import { useCallback, useEffect, useMemo, useState } from 'react';
import axiosInstance from '../../api/axios.config';
import toast from 'react-hot-toast';
import Loading from '../../components/common/Loading';

import GoalForm from '../../components/personalTracking/GoalForm';
import GoalProgress from '../../components/personalTracking/GoalProgress';
import GoalHistoryCards from '../../components/personalTracking/GoalHistoryCards';

const getLocalDateISO = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export default function GoalPage() {
  const todayISO = useMemo(() => getLocalDateISO(), []);

  const [goals, setGoals] = useState([]);
  const [editingGoal, setEditingGoal] = useState(null);
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  const refreshGoals = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/personal-tracking/goals');
      setGoals(res.data?.data?.goals ?? []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load goals');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshGoals();
  }, [refreshGoals]);

  const todaysGoals = useMemo(() => {
    return (goals ?? []).filter((g) => String(g.date ?? '') === todayISO);
  }, [goals, todayISO]);

  const completedCount = useMemo(
    () => todaysGoals.filter((g) => g.status === 'complete').length,
    [todaysGoals]
  );
  const pendingCount = useMemo(
    () => todaysGoals.filter((g) => g.status === 'incomplete').length,
    [todaysGoals]
  );
  const missingCount = useMemo(
    () => (goals ?? []).filter((g) => g.status === 'incomplete' && String(g.date ?? '') < todayISO).length,
    [goals, todayISO]
  );

  const handleAddGoal = async ({ goalName, goalType }) => {
    try {
      await axiosInstance.post('/personal-tracking/goals', {
        goalName,
        goalType,
        status: 'incomplete',
        date: todayISO,
      });
      await refreshGoals();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add goal');
      throw err;
    }
  };

  const handleMarkComplete = async (goalId) => {
    try {
      const res = await axiosInstance.patch(`/personal-tracking/goals/${goalId}`, { status: 'complete' });
      const updated = res.data?.data?.goal;
      if (updated?.status === 'complete') {
        toast.success('Great job! Goal completed 🎉');
      } else {
        toast.success(res.data?.message || 'Progress updated');
      }
      await refreshGoals();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update goal');
    }
  };

  const handleDeleteGoal = async (goalId) => {
    if (!confirm('Delete this goal?')) return;
    try {
      await axiosInstance.delete(`/personal-tracking/goals/${goalId}`);
      await refreshGoals();
      if (editingGoal?._id && String(editingGoal._id) === String(goalId)) {
        setEditingGoal(null);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete goal');
    }
  };

  const handleUpdateGoal = async (goalId, { goalName, goalType }) => {
    try {
      await axiosInstance.put(`/personal-tracking/goals/${goalId}`, { goalName, goalType });
      toast.success('Goal updated successfully');
      setEditingGoal(null);
      await refreshGoals();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update goal');
    }
  };

  const latestGoals = [...goals].sort((a, b) => {
    if (b.date !== a.date) return b.date.localeCompare(a.date);
    return String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? ''));
  });

  const filteredGoals = useMemo(() => {
    return latestGoals.filter((g) => {
      const typeOk = typeFilter === 'all' ? true : g.goalType === typeFilter;
      if (!typeOk) return false;
      if (statusFilter === 'all') return true;
      if (statusFilter === 'active') return g.status === 'incomplete';
      if (statusFilter === 'completed') return g.status === 'complete';
      if (statusFilter === 'missed') return g.status === 'incomplete' && String(g.date ?? '') < todayISO;
      return true;
    });
  }, [latestGoals, typeFilter, statusFilter, todayISO]);

  const weeklyProgressByGoal = useMemo(() => {
    const normalizeName = (s) =>
      String(s ?? '')
        .trim()
        .toLowerCase()
        .replace(/\s+/g, ' ');

    const now = new Date();
    const day = now.getUTCDay() || 7;
    const monday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    monday.setUTCDate(monday.getUTCDate() - (day - 1));
    const sunday = new Date(monday);
    sunday.setUTCDate(monday.getUTCDate() + 6);

    const toISODate = (d) => String(d ?? '').slice(0, 10);
    const inThisWeek = (d) => {
      const iso = toISODate(d);
      if (!iso) return false;
      const x = new Date(`${iso}T00:00:00Z`);
      return x >= monday && x <= sunday;
    };

    const weekDays = Array.from({ length: 7 }).map((_, i) => {
      const dt = new Date(monday);
      dt.setUTCDate(monday.getUTCDate() + i);
      return toISODate(dt.toISOString());
    });

    const progress = {};
    const addKeyIfMissing = (key, init) => {
      if (!progress[key]) progress[key] = init;
    };

    const weekGoals = (goals ?? []).filter((g) => inThisWeek(g.date));

    for (const g of weekGoals) {
      const goalType = g.goalType;
      const goalNameNorm = normalizeName(g.goalName);
      if (!goalType || !goalNameNorm) continue;
      const key = `${goalType}::${goalNameNorm}`;

      if (goalType === 'daily') {
        addKeyIfMissing(key, { goalType, goalNameNorm, days: weekDays.map(() => false) });
        const idx = weekDays.indexOf(toISODate(g.date));
        const done = g.status === 'complete';
        if (idx >= 0 && done) progress[key].days[idx] = true;
        continue;
      }

      if (goalType === 'weekly') {
        addKeyIfMissing(key, { goalType, goalNameNorm, current: 0, target: 1 });
        const done = Math.min(1, g.progress?.current ?? (g.status === 'complete' ? 1 : 0)) >= 1;
        if (done) progress[key].current = 1;
        continue;
      }

      if (goalType === 'custom') {
        const target = g.progress?.target ?? g.frequencyPerWeek ?? 3;
        addKeyIfMissing(key, { goalType, goalNameNorm, current: 0, target: Number(target) || 3 });
        const inc = g.progress?.current ?? g.completedSessions ?? (g.status === 'complete' ? 1 : 0);
        const nextCurrent = Number(inc) || 0;
        progress[key].current = Math.max(progress[key].current ?? 0, nextCurrent);
        progress[key].target = Number(target) || progress[key].target || 3;
      }
    }

    for (const [key, row] of Object.entries(progress)) {
      if (row.goalType === 'daily') continue;
      row.current = Math.max(0, Math.min(row.current ?? 0, row.target ?? 1));
      progress[key] = row;
    }

    return progress;
  }, [goals]);

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
      {/* Header Section */}
      <div className="text-center mb-2">
        <p className="text-xs font-bold uppercase tracking-wider text-primary-600">Goals</p>
        <h2 className="text-2xl font-bold text-gray-900 mt-1">Daily and weekly goal tracking</h2>
        <p className="text-sm text-gray-500 mt-1">
          Add goals, mark them complete, and track your progress over time.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Goal Form Card */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-shadow hover:shadow-md">
            <div className="p-6">
              <GoalForm
                existingGoals={goals}
                onAddGoal={handleAddGoal}
                editingGoal={editingGoal}
                onUpdateGoal={handleUpdateGoal}
                onCancelEdit={() => setEditingGoal(null)}
              />
            </div>
          </div>
        </div>

        {/* Progress & History Section */}
        <div className="lg:col-span-2 space-y-8">
          {/* Progress Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-shadow hover:shadow-md">
            <div className="p-6">
              <GoalProgress
                completedCount={completedCount}
                pendingCount={pendingCount}
                missingCount={missingCount}
              />
            </div>
          </div>

          {/* History Cards Section */}
          <div>
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Goal History</h3>
              <p className="text-sm text-gray-500">Track your past and upcoming goals</p>
            </div>
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="all">All</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="custom">Custom Weekly</option>
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="all">All status</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="missed">Missed</option>
              </select>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-shadow hover:shadow-md">
              <div className="p-6">
                <GoalHistoryCards
                  goals={filteredGoals}
                  weeklyProgressByGoal={weeklyProgressByGoal}
                  onMarkComplete={handleMarkComplete}
                  onDelete={handleDeleteGoal}
                  todayISO={todayISO}
                  onEdit={(g) => setEditingGoal(g)}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}