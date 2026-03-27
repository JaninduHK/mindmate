import { useEffect, useMemo, useState } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts';
import { adminAPI } from '../../api/admin.api';
import axiosInstance from '../../api/axios.config';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const MOOD_COLORS = {
  Positive: '#10b981', // green-500
  Stable: '#eab308', // yellow-500
  Pressure: '#f97316', // orange-500
  Low: '#ef4444', // red-500
};

const MOOD_EMOJI = {
  Positive: '😊',
  Stable: '😐',
  Pressure: '😣',
  Low: '😔',
};

const getMonthRange = (d) => {
  const start = new Date(d.getFullYear(), d.getMonth(), 1);
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  return { from: format(start, 'yyyy-MM-dd'), to: format(end, 'yyyy-MM-dd') };
};

export default function AdminWellnessDashboard() {
  const [activeUsersCount, setActiveUsersCount] = useState(0);
  const [mostMissedGoal, setMostMissedGoal] = useState('—');
  const [moodDistribution, setMoodDistribution] = useState([]);
  const [loading, setLoading] = useState(true);

  const monthRange = useMemo(() => getMonthRange(new Date()), []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [usersRes, goalsRes, moodsRes] = await Promise.all([
          adminAPI.listUsers({ limit: 1000 }),
          axiosInstance.get('/personal-tracking/goals'),
          axiosInstance.get('/personal-tracking/moods', { params: monthRange }),
        ]);

        const users = usersRes?.data?.users ?? usersRes?.users ?? [];
        const active = users.filter((u) => u.isActive).length;
        setActiveUsersCount(active);

        const goals = goalsRes?.data?.data?.goals ?? [];
        const incomplete = goals.filter((g) => g.status === 'incomplete');
        const counts = incomplete.reduce((acc, g) => {
          const k = String(g.goalName ?? '').trim();
          if (!k) return acc;
          acc[k] = (acc[k] ?? 0) + 1;
          return acc;
        }, {});
        const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
        setMostMissedGoal(top?.[0] ?? '—');

        const moods = moodsRes?.data?.data?.moods ?? [];
        const moodCounts = moods.reduce((acc, m) => {
          const k = m?.mood;
          if (!k) return acc;
          acc[k] = (acc[k] ?? 0) + 1;
          return acc;
        }, {});

        const distribution = Object.entries(moodCounts).map(([mood, count]) => ({
          mood,
          moodLabel: `${MOOD_EMOJI[mood] ?? '🙂'} ${mood}`,
          count,
          color: MOOD_COLORS[mood] ?? '#0284c7',
        }));

        distribution.sort((a, b) => b.count - a.count);
        setMoodDistribution(distribution);
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to load admin wellness');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [monthRange]);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
        <div className="flex flex-col items-center justify-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-200 border-t-primary-600"></div>
          <p className="mt-4 text-sm text-gray-500">Loading wellness data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-200 hover:shadow-md">
      <div className="p-6">
        <div className="mb-6">
          <p className="text-xs font-bold uppercase tracking-wider text-primary-600">Admin Wellness</p>
          <h3 className="text-2xl font-bold text-gray-900 mt-1">Wellness Dashboard</h3>
          <p className="text-sm text-gray-500 mt-1">Overview of user wellness metrics and insights</p>
        </div>

        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-100 p-5 transition-all duration-200 hover:shadow-md">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Active Users</p>
                  <p className="mt-2 text-3xl font-bold text-gray-900">{activeUsersCount.toLocaleString()}</p>
                  <p className="text-sm text-gray-500 mt-1">Currently active users</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
                  <span className="text-primary-600 text-lg">👥</span>
                </div>
              </div>
            </div>

            <div className="md:col-span-2 bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-100 p-5 transition-all duration-200 hover:shadow-md">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Most Missed Goal</p>
                  <p className="mt-2 text-xl font-bold text-gray-900 truncate">{mostMissedGoal}</p>
                  <p className="text-sm text-gray-500 mt-1">Based on your goals history</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                  <span className="text-amber-600 text-lg">🎯</span>
                </div>
              </div>
            </div>
          </div>

          {/* Mood Distribution Chart */}
          <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-100 p-5 transition-all duration-200 hover:shadow-md">
            <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-primary-600">Mood Distribution</p>
                <p className="text-sm text-gray-500 mt-1">
                  Current month mood entries
                </p>
              </div>
              {moodDistribution.length > 0 && (
                <div className="flex flex-wrap gap-3 text-xs">
                  {moodDistribution.map((item) => (
                    <span key={item.mood} className="inline-flex items-center gap-1.5">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-gray-600 capitalize">{item.mood}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {moodDistribution.length > 0 ? (
              <div className="h-80 mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={moodDistribution}
                    margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                    barSize={48}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                    <XAxis
                      dataKey="moodLabel"
                      tick={{ fontSize: 12, fill: '#6b7280' }}
                      axisLine={{ stroke: '#e5e7eb' }}
                      tickLine={false}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fontSize: 12, fill: '#6b7280' }}
                      axisLine={{ stroke: '#e5e7eb' }}
                      tickLine={false}
                    />
                    <Tooltip
                      cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                      content={({ active, payload, label }) => {
                        if (!active || !payload?.length) return null;
                        const p = payload[0]?.payload;
                        return (
                          <div className="bg-white border border-gray-200 shadow-lg rounded-xl p-3 text-sm">
                            <p className="font-semibold text-gray-900">{label}</p>
                            <p className="text-gray-600 mt-1">
                              Count: <span className="font-bold text-primary-600">{p?.count ?? 0}</span>
                            </p>
                          </div>
                        );
                      }}
                    />
                    <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                      {moodDistribution.map((entry, idx) => (
                        <Cell key={`cell-${idx}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-4xl mb-3">📊</div>
                <p className="text-gray-500 font-medium">No mood data yet</p>
                <p className="text-sm text-gray-400 mt-1">Add mood entries to see distribution.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}