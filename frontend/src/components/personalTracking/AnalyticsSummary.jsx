import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#FF8082', '#8884D8'];

const AnalyticsSummary = ({ analytics }) => {
  if (!analytics) {
    return (
      <div className="text-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-200 border-t-primary-600 mx-auto"></div>
        <p className="text-gray-500 mt-4">Loading analytics...</p>
      </div>
    );
  }

  const { mostCommonMood, moodDistribution = [], goalSummary = [] } = analytics;

  // Format data for charts
  const moodChartData = moodDistribution.map(item => ({
    name: item.mood || 'Unknown',
    value: item.count || 0,
  }));

  const goalChartData = goalSummary.map(item => ({
    name: item._id === 'complete' ? 'Completed' : item._id === 'incomplete' ? 'In Progress' : item._id,
    value: item.count || 0,
    status: item._id,
  }));

  // Calculate totals
  const completedGoals = goalSummary.find(g => g._id === 'complete')?.count || 0;
  const inProgressGoals = goalSummary.find(g => g._id === 'incomplete')?.count || 0;
  const totalMoods = moodDistribution.reduce((sum, m) => sum + (m.count || 0), 0);

  return (
    <div className="space-y-8">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Most Common Mood */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600 uppercase tracking-wider">Most Common Mood</p>
              <p className="text-4xl font-bold text-blue-900 mt-2">{mostCommonMood || 'N/A'}</p>
              <p className="text-sm text-blue-700 mt-1">Overall dominant mood</p>
            </div>
            <div className="text-5xl opacity-20">😊</div>
          </div>
        </div>

        {/* Goals Completed */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600 uppercase tracking-wider">Goals Completed</p>
              <p className="text-4xl font-bold text-green-900 mt-2">{completedGoals}</p>
              <p className="text-sm text-green-700 mt-1">Total completed goals</p>
            </div>
            <div className="text-5xl opacity-20">✅</div>
          </div>
        </div>

        {/* Goals In Progress */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600 uppercase tracking-wider">Goals In Progress</p>
              <p className="text-4xl font-bold text-purple-900 mt-2">{inProgressGoals}</p>
              <p className="text-sm text-purple-700 mt-1">Goals currently active</p>
            </div>
            <div className="text-5xl opacity-20">🎯</div>
          </div>
        </div>

        {/* Total Entries */}
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-600 uppercase tracking-wider">Mood Entries</p>
              <p className="text-4xl font-bold text-orange-900 mt-2">{totalMoods}</p>
              <p className="text-sm text-orange-700 mt-1">This month</p>
            </div>
            <div className="text-5xl opacity-20">📊</div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Mood Distribution Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Mood Distribution</h3>
          {moodChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={moodChartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {moodChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value} entries`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-400">
              <p className="text-center">No mood data available. Start tracking your mood!</p>
            </div>
          )}
        </div>

        {/* Goal Status Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Goal Status</h3>
          {goalChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={goalChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => `${value} goals`} />
                <Bar dataKey="value" fill="#8884d8" radius={[8, 8, 0, 0]}>
                  {goalChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.status === 'complete' ? '#10b981' : '#f59e0b'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-400">
              <p className="text-center">No goal data available. Start setting goals!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsSummary;
