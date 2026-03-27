import { useCallback, useEffect, useMemo, useState } from 'react';
import axiosInstance from '../../api/axios.config';
import toast from 'react-hot-toast';
import Loading from '../../components/common/Loading';

import GoalForm from '../../components/personalTracking/GoalForm';
import GoalProgress from '../../components/personalTracking/GoalProgress';
import GoalHistoryCards from '../../components/personalTracking/GoalHistoryCards';

export default function GoalPage() {
  const todayISO = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const [goals, setGoals] = useState([]);
  const [editingGoal, setEditingGoal] = useState(null);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="bg-white rounded-xl shadow-sm p-8">
          <Loading />
        </div>
      </div>
    );
  }

  const latestGoals = [...goals].sort((a, b) => {
    if (b.date !== a.date) return b.date.localeCompare(a.date);
    return String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? ''));
  });

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
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-shadow hover:shadow-md">
              <div className="p-6">
                <GoalHistoryCards
                  goals={latestGoals}
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