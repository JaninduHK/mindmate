import toast from 'react-hot-toast';
import { useMemo, useState } from 'react';
import axiosInstance from '../../api/axios.config';
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

const MOOD_UI = {
  Positive: { emoji: '😊', bg: 'bg-green-600', text: 'text-white', pill: 'bg-green-50 border-green-200' },
  Stable: { emoji: '😐', bg: 'bg-yellow-500', text: 'text-gray-900', pill: 'bg-yellow-50 border-yellow-200' },
  Pressure: { emoji: '😣', bg: 'bg-orange-500', text: 'text-white', pill: 'bg-orange-50 border-orange-200' },
  Low: { emoji: '😔', bg: 'bg-red-500', text: 'text-white', pill: 'bg-red-50 border-red-200' },
};

const StatCard = ({ label, value, icon, accent = 'bg-primary-600' }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 transition-all duration-200 hover:shadow-md">
    <p className="text-xs font-bold uppercase tracking-wider text-gray-500">{label}</p>
    <div className="mt-2 flex items-center justify-between gap-4">
      <div className="min-w-0">
        <p className="text-2xl font-bold text-gray-900 truncate">{value}</p>
      </div>
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${accent}`}>
        {icon}
      </div>
    </div>
  </div>
);

export default function AnalyticsCards({ summary }) {
  const todayISO = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [checking, setChecking] = useState(false);

  const bothDatesSelected = Boolean(startDate && endDate);
  const downloadDisabled = !bothDatesSelected || checking;

  const mostCommonMood = summary?.mostCommonMood ?? null;
  const stressCount = summary?.stressCount ?? 0;
  const missingGoalsCount = summary?.missingGoalsCount ?? 0;
  const moodDistribution = summary?.moodDistribution ?? [];

  const moodUi = mostCommonMood ? MOOD_UI[mostCommonMood] : null;
  const normalizePercent = (p) => {
    const n = Number(p ?? 0);
    if (!Number.isFinite(n)) return 0;
    return n > 1 ? n : n * 100;
  };
  const moodChartData = moodDistribution.map((d) => ({
    name: d.mood,
    value: d.count ?? 0,
    percent: d.percent ?? 0,
    color:
      d.mood === 'Positive'
        ? '#16a34a'
        : d.mood === 'Stable'
          ? '#eab308'
          : d.mood === 'Pressure'
            ? '#f97316'
            : d.mood === 'Low'
              ? '#ef4444'
              : '#0284c7',
  }));

  const handleStartDateChange = (e) => {
    const v = e.target.value;
    if (!v) {
      setStartDate('');
      return;
    }
    if (v > todayISO) return;
    setStartDate(v);
    if (endDate && endDate < v) setEndDate(v);
  };

  const handleEndDateChange = (e) => {
    const v = e.target.value;
    if (!v) {
      setEndDate('');
      return;
    }
    if (v > todayISO) return;
    if (startDate && v < startDate) {
      setEndDate(startDate);
      return;
    }
    setEndDate(v);
  };

  const handleDownloadReport = async () => {
    if (!startDate || !endDate) return;

    setChecking(true);
    try {
      const res = await axiosInstance.get('/personal-tracking/analytics/report-range-check', {
        params: { startDate, endDate },
      });
      const hasData = res.data?.data?.hasData === true;
      if (!hasData) {
        toast.error('No data found for the selected period');
        return;
      }
      toast('Report generation will be available in the final release!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not validate report range');
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Most Common Mood Card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 transition-all duration-200 hover:shadow-md">
          <p className="text-xs font-bold uppercase tracking-wider text-primary-600">Most Common Mood</p>
          {moodUi ? (
            <div className="mt-4 flex items-center gap-3">
              <div className={`text-5xl leading-none`}>{moodUi.emoji}</div>
              <div>
                <p className="text-xl font-bold text-gray-900 capitalize">{mostCommonMood}</p>
                <p className="text-xs text-gray-500 mt-1">Overall dominant mood</p>
              </div>
            </div>
          ) : (
            <div className="mt-4 flex items-center gap-3">
              <div className="text-5xl leading-none text-gray-300">🙂</div>
              <div>
                <p className="text-xl font-bold text-gray-400">No data yet</p>
                <p className="text-xs text-gray-500 mt-1">Add mood entries to see insights</p>
              </div>
            </div>
          )}
        </div>

        <StatCard
          label="Stress Count"
          value={stressCount}
          accent="bg-amber-500"
          icon={<span className="text-white text-lg">😣</span>}
        />
        <StatCard
          label="Missing Goals"
          value={missingGoalsCount}
          accent="bg-red-500"
          icon={<span className="text-white text-lg">🎯</span>}
        />

        {/* Reminder Status Card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 transition-all duration-200 hover:shadow-md">
          <p className="text-xs font-bold uppercase tracking-wider text-primary-600">Reminder Status</p>
          <div className="mt-4 space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <p className="text-sm text-gray-700">Reminder Enabled</p>
            </div>
            <div className="text-xs text-gray-500">
              <p>Last Reminder: <span className="font-medium text-gray-700">—</span></p>
              <p className="mt-1">Last Sync: <span className="font-medium text-gray-700">—</span></p>
            </div>
          </div>
        </div>
      </div>

      {/* Mood Distribution Chart */}
      {moodDistribution.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 transition-all duration-200 hover:shadow-md">
          <p className="text-xs font-bold uppercase tracking-wider text-primary-600">Mood Distribution</p>
          <div className="mt-6 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={moodChartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={95}
                  paddingAngle={2}
                  label={false}
                  labelLine={false}
                >
                  {moodChartData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name, item) => {
                    const pct = normalizePercent(item?.payload?.percent ?? 0);
                    return [`${value} entries (${pct.toFixed(1)}%)`, name];
                  }}
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.75rem',
                    padding: '8px 12px',
                    fontSize: '0.875rem',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 flex flex-wrap gap-4 justify-center text-sm text-gray-700">
              {moodChartData
                .filter((d) => (d.value ?? 0) > 0)
                .map((d) => (
                  <span key={d.name} className="inline-flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                    <span className="font-medium capitalize">{d.name}</span>
                    <span className="text-gray-500">
                      {normalizePercent(d.percent).toFixed(1)}%
                    </span>
                  </span>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Download Report Section */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 transition-all duration-200 hover:shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-gray-900">Download Report</p>
            <p className="text-sm text-gray-500 mt-1">
              Keep track of your journey. Download your final analysis report to review your trends and habits.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex flex-col">
              <label className="text-xs font-semibold text-gray-600 mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={handleStartDateChange}
                max={todayISO}
                className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
              />
            </div>

            <div className="flex flex-col">
              <label className="text-xs font-semibold text-gray-600 mb-1">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={handleEndDateChange}
                max={todayISO}
                min={startDate || undefined}
                className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
              />
            </div>

            <button
              type="button"
              disabled={downloadDisabled}
              className={`font-semibold px-6 py-2 rounded-xl transition-all duration-200 ${
                downloadDisabled
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-primary-600 hover:bg-primary-700 text-white hover:shadow-md active:scale-[0.98]'
              }`}
              onClick={handleDownloadReport}
            >
              {checking ? 'Checking…' : 'Download Report'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}