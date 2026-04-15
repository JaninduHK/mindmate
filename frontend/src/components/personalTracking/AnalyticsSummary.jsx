import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#FF8082'];

const AnalyticsSummary = ({ analytics }) => {
  if (!analytics) {
    return <div className="text-center p-4">Loading analytics...</div>;
  }

  const { mostCommonMood, moodDistribution, goalSummary } = analytics;

  const moodData = moodDistribution?.map(item => ({ name: item.mood, value: item.count })) || [];
  const goalData = goalSummary?.map(item => ({ name: item._id, value: item.count })) || [];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-4 shadow rounded-lg text-center">
          <h3 className="text-sm font-medium text-gray-500">Most Common Mood</h3>
          <p className="mt-1 text-3xl font-semibold text-gray-900">{analytics?.mostCommonMood || 'N/A'}</p>
          <p className="text-xs text-gray-500">Overall dominant mood</p>
        </div>
        <div className="bg-white p-4 shadow rounded-lg text-center">
          <h3 className="text-sm font-medium text-gray-500">Goals Completed</h3>
          <p className="mt-1 text-3xl font-semibold text-gray-900">{goalSummary?.find(g => g._id === 'complete')?.count || 0}</p>
           <p className="text-xs text-gray-500">Total completed goals</p>
        </div>
        <div className="bg-white p-4 shadow rounded-lg text-center">
          <h3 className="text-sm font-medium text-gray-500">Goals In Progress</h3>
          <p className="mt-1 text-3xl font-semibold text-gray-900">{goalSummary?.find(g => g._id === 'in_progress')?.count || 0}</p>
           <p className="text-xs text-gray-500">Goals currently active</p>
        </div>
        <div className="bg-white p-4 shadow rounded-lg text-center">
          <h3 className="text-sm font-medium text-gray-500">Reminder Status</h3>
          <p className="mt-1 text-base font-semibold text-green-600">Reminder Enabled</p>
           <p className="text-xs text-gray-500">Last Sync: Just now</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 shadow rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Mood Distribution</h3>
          {moodData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={moodData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} fill="#8884d8" label>
                  {moodData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p>No mood data available.</p>
          )}
        </div>
        <div className="bg-white p-6 shadow rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Goal Status</h3>
           {goalData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={goalData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} fill="#82ca9d" label>
                    {goalData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p>No goal data available.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsSummary;
