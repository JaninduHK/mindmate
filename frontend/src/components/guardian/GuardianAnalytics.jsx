import React from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp, Target } from 'lucide-react';

const MOOD_COLORS = {
  Positive: '#10B981',
  Stable: '#3B82F6',
  Pressure: '#F59E0B',
  Low: '#EF4444',
};

const GuardianAnalytics = ({ moodAnalytics = null, goalAnalytics = null, loading = false }) => {
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-80 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-80 animate-pulse" />
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-80 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Mood Distribution */}
        {moodAnalytics?.distribution && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Mood Distribution (Last 30 Days)</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={Object.entries(moodAnalytics.distribution).map(([mood, count]) => ({
                      name: mood,
                      value: count,
                    }))}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {Object.keys(moodAnalytics.distribution).map((mood) => (
                      <Cell key={mood} fill={MOOD_COLORS[mood] || '#8884d8'} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Recent Moods */}
        {moodAnalytics?.recentMoods && moodAnalytics.recentMoods.length > 0 && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Mood Entries</h3>
            <div className="space-y-3">
              {moodAnalytics.recentMoods.map((mood, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-sm text-gray-900">{mood.mood}</span>
                    <span className="text-xs text-gray-500">
                      {new Date(mood.date).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{mood.keyword}</p>
                  <p className="text-xs text-gray-500 mt-1">{mood.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Goal Analytics */}
      {goalAnalytics && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Goal Progress</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {/* Total Goals */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg">
              <p className="text-sm text-blue-600 font-medium mb-1">Total Goals</p>
              <p className="text-3xl font-bold text-blue-900">{goalAnalytics.total}</p>
            </div>

            {/* Completed */}
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-4 rounded-lg">
              <p className="text-sm text-emerald-600 font-medium mb-1">Completed</p>
              <p className="text-3xl font-bold text-emerald-900">{goalAnalytics.completed}</p>
            </div>

            {/* In Progress */}
            <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-4 rounded-lg">
              <p className="text-sm text-amber-600 font-medium mb-1">In Progress</p>
              <p className="text-3xl font-bold text-amber-900">{goalAnalytics.inProgress}</p>
            </div>

            {/* Completion Rate */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg">
              <p className="text-sm text-purple-600 font-medium mb-1">Completion Rate</p>
              <p className="text-3xl font-bold text-purple-900">{goalAnalytics.completionRate}%</p>
            </div>
          </div>

          {/* Goals List */}
          {goalAnalytics.goals && goalAnalytics.goals.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-700">Recent Goals</h4>
              {goalAnalytics.goals.map((goal) => (
                <div key={goal.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{goal.title}</p>
                    <p className="text-xs text-gray-500 capitalize">{goal.type}</p>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                    goal.status === 'complete'
                      ? 'bg-emerald-100 text-emerald-700'
                      : goal.status === 'in_progress'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-200 text-gray-700'
                  }`}>
                    {goal.status.replace('_', ' ')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GuardianAnalytics;
