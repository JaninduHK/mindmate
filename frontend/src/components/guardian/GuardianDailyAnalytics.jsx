import React from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
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
import { Calendar, Activity, TrendingUp } from 'lucide-react';

const MOOD_COLORS = {
  Positive: '#10B981',
  Stable: '#3B82F6',
  Pressure: '#F59E0B',
  Low: '#EF4444',
};

const GuardianDailyAnalytics = ({ dailyData = null, loading = false }) => {
  if (loading) {
    return (
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!dailyData) {
    return (
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Daily Analytics</h3>
        </div>
        <p className="text-gray-500">No data available yet</p>
      </div>
    );
  }

  // Today's summary cards
  const todayStats = dailyData.todayStats || {};
  const weekData = dailyData.weeklyData || [];
  const moodHistory = dailyData.moodHistory || [];
  const goalProgress = dailyData.goalProgress || {};
  const activitySummary = dailyData.activitySummary || {};

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Calendar className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">Daily Analytics</h3>
        <span className="text-sm text-gray-500 ml-auto">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </span>
      </div>

      {/* Today's Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Mood Today */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
          <p className="text-sm text-purple-600 font-medium mb-1">Today's Mood</p>
          <p className="text-3xl font-bold text-purple-900">{todayStats.mood || 'N/A'}</p>
          <p className="text-xs text-purple-600 mt-2">
            Score: {todayStats.moodScore || 0}/5
          </p>
        </div>

        {/* Goals Completed Today */}
        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-4 rounded-lg border border-emerald-200">
          <p className="text-sm text-emerald-600 font-medium mb-1">Goals Completed</p>
          <p className="text-3xl font-bold text-emerald-900">{todayStats.goalsCompletedToday || 0}</p>
          <p className="text-xs text-emerald-600 mt-2">
            Out of {todayStats.totalGoals || 0} total
          </p>
        </div>

        {/* Activities Today */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-600 font-medium mb-1">Activities</p>
          <p className="text-3xl font-bold text-blue-900">{todayStats.activitiesCount || 0}</p>
          <p className="text-xs text-blue-600 mt-2">
            {todayStats.lastActivityTime || 'No activity'}
          </p>
        </div>

        {/* Engagement Score */}
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg border border-orange-200">
          <p className="text-sm text-orange-600 font-medium mb-1">Engagement</p>
          <p className="text-3xl font-bold text-orange-900">{todayStats.engagementScore || 0}%</p>
          <p className="text-xs text-orange-600 mt-2">
            {todayStats.engagementLevel || 'Moderate'}
          </p>
        </div>
      </div>

      {/* Weekly Mood Trend */}
      {weekData && weekData.length > 0 && (
        <div className="border-t pt-6">
          <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            Weekly Mood Trend
          </h4>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weekData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false}
                  tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { weekday: 'short' })}
                />
                <YAxis axisLine={false} tickLine={false} domain={[0, 5]} />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="moodScore" 
                  stroke="#10B981" 
                  strokeWidth={2}
                  dot={{ fill: '#10B981', r: 6 }}
                  activeDot={{ r: 8 }}
                  name="Mood Score"
                />
                <Line 
                  type="monotone" 
                  dataKey="engagementScore" 
                  stroke="#3B82F6" 
                  strokeWidth={2}
                  dot={{ fill: '#3B82F6', r: 6 }}
                  activeDot={{ r: 8 }}
                  name="Engagement Score"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Mood History - Today's Entries */}
      {moodHistory && moodHistory.length > 0 && (
        <div className="border-t pt-6">
          <h4 className="text-md font-semibold text-gray-900 mb-4">Today's Mood Entries</h4>
          <div className="space-y-3">
            {moodHistory.map((entry, index) => (
              <div key={index} className="p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span 
                      className="px-2.5 py-1 rounded-full text-xs font-medium text-white"
                      style={{ backgroundColor: MOOD_COLORS[entry.mood] || '#9CA3AF' }}
                    >
                      {entry.mood}
                    </span>
                    <span className="text-sm font-medium text-gray-900">Score: {entry.score}/5</span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(entry.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                {entry.keyword && (
                  <p className="text-sm text-gray-700 font-medium mb-1">Keyword: {entry.keyword}</p>
                )}
                {entry.description && (
                  <p className="text-sm text-gray-600">{entry.description}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Goal Progress - Today */}
      {goalProgress && Object.keys(goalProgress).length > 0 && (
        <div className="border-t pt-6">
          <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-600" />
            Goal Progress Today
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Pie Chart */}
            <div className="flex flex-col items-center justify-center">
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Completed', value: goalProgress.completed || 0 },
                        { name: 'In Progress', value: goalProgress.inProgress || 0 },
                        { name: 'Not Started', value: goalProgress.notStarted || 0 },
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => value > 0 ? `${name}: ${value}` : ''}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      <Cell fill="#10B981" />
                      <Cell fill="#3B82F6" />
                      <Cell fill="#9CA3AF" />
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Stats */}
            <div className="space-y-3 flex flex-col justify-center">
              <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-200">
                <p className="text-sm text-emerald-600 font-medium">Completed Today</p>
                <p className="text-2xl font-bold text-emerald-900">{goalProgress.completed || 0}</p>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-600 font-medium">In Progress</p>
                <p className="text-2xl font-bold text-blue-900">{goalProgress.inProgress || 0}</p>
              </div>
              <div className="bg-gray-100 p-3 rounded-lg border border-gray-300">
                <p className="text-sm text-gray-600 font-medium">Not Started</p>
                <p className="text-2xl font-bold text-gray-900">{goalProgress.notStarted || 0}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Activity Summary */}
      {activitySummary && Object.keys(activitySummary).length > 0 && (
        <div className="border-t pt-6">
          <h4 className="text-md font-semibold text-gray-900 mb-4">Activity Summary</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-600 font-medium mb-2">Mood Entries</p>
              <p className="text-2xl font-bold text-blue-900">{activitySummary.moodEntriesCount || 0}</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <p className="text-sm text-purple-600 font-medium mb-2">Goal Updates</p>
              <p className="text-2xl font-bold text-purple-900">{activitySummary.goalUpdatesCount || 0}</p>
            </div>
            <div className="p-4 bg-pink-50 rounded-lg border border-pink-200">
              <p className="text-sm text-pink-600 font-medium mb-2">Sessions</p>
              <p className="text-2xl font-bold text-pink-900">{activitySummary.sessionsCount || 0}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GuardianDailyAnalytics;
