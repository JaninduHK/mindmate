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
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
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

  const handleReactivate = async (goalId) => {
    if (!confirm('Re-activate this goal for today?')) return;
    try {
      // Reset the goal to incomplete status for today
      await axiosInstance.patch(`/personal-tracking/goals/${goalId}`, { status: 'incomplete' });
      toast.success('Goal re-activated for today');
      await refreshGoals();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to re-activate goal');
    }
  };

  const handleClearFilters = () => {
    setTypeFilter('all');
    setStatusFilter('all');
    setSearchQuery('');
    setStartDate('');
    setEndDate('');
  };

  const latestGoals = [...goals].sort((a, b) => {
    if (b.date !== a.date) return b.date.localeCompare(a.date);
    return String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? ''));
  });

  const filteredGoals = useMemo(() => {
    return latestGoals.filter((g) => {
      // type filter
      const typeOk = typeFilter === 'all' ? true : g.goalType === typeFilter;
      if (!typeOk) return false;

      // status filter
      if (statusFilter === 'active' && g.status !== 'incomplete') return false;
      if (statusFilter === 'completed' && g.status !== 'complete') return false;
      if (statusFilter === 'missed' && !(g.status === 'incomplete' && String(g.date ?? '') < todayISO)) return false;

      // search filter
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const name = String(g.goalName ?? '').toLowerCase();
        if (!name.includes(query)) return false;
      }

      // date range filter
      const goalDate = String(g.date ?? '').slice(0, 10);
      if (startDate && goalDate < startDate) return false;
      if (endDate && goalDate > endDate) return false;

      return true;
    });
  }, [latestGoals, typeFilter, statusFilter, searchQuery, startDate, endDate, todayISO]);

  /**
   * Merge completionDates across ALL documents that share the same
   * goalType + normalized goalName.  This is what makes "planting" on
   * Apr 24 and "planting" on Apr 25 share a single recurring history.
   */
  const recurringCompletionDates = useMemo(() => {
    const normalizeName = (s) =>
      String(s ?? '').trim().toLowerCase().replace(/\s+/g, ' ');

    const map = {};
    for (const g of goals ?? []) {
      const key = `${g.goalType}::${normalizeName(g.goalName)}`;
      if (!map[key]) map[key] = new Set();
      // include the goal's own date if it is complete
      if (g.status === 'complete') {
        map[key].add(String(g.date ?? '').slice(0, 10));
      }
      // include every explicit completionDate stored on the document
      for (const d of Array.isArray(g.completionDates) ? g.completionDates : []) {
        const iso = String(d).slice(0, 10);
        if (iso) map[key].add(iso);
      }
    }
    // convert Sets → sorted arrays
    const result = {};
    for (const [key, set] of Object.entries(map)) {
      result[key] = [...set].filter(Boolean).sort();
    }
    return result;
  }, [goals]);

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
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">All Types</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="custom">3x/week</option>
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="missed">Missed</option>
              </select>
              <input
                type="text"
                placeholder="Search by goal name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 min-w-[200px]"
              />
              <input
                type="date"
                placeholder="Start date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <input
                type="date"
                placeholder="End date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <button
                type="button"
                onClick={handleClearFilters}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Clear Filters
              </button>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-shadow hover:shadow-md">
              <div className="p-6">
                <GoalHistoryCards
                  goals={filteredGoals}
                  weeklyProgressByGoal={weeklyProgressByGoal}
                  recurringCompletionDates={recurringCompletionDates}
                  onMarkComplete={handleMarkComplete}
                  onDelete={handleDeleteGoal}
                  todayISO={todayISO}
                  onEdit={(g) => setEditingGoal(g)}
                  onReactivate={handleReactivate}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}