import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
} from 'recharts';
import axiosInstance from '../../api/axios.config';

const MOOD_ORDER = ['Positive', 'Stable', 'Pressure', 'Low'];
const MOOD_COLORS = {
  Positive: '#4ADE80',
  Stable: '#60A5FA',
  Pressure: '#FACC15',
  Low: '#F87171',
};

const DEFAULTS = {
  Positive: { emoji: '😊', keyword: 'Calm' },
  Stable: { emoji: '😐', keyword: 'Busy' },
  Pressure: { emoji: '😰', keyword: 'Worried' },
  Low: { emoji: '😔', keyword: 'Tired' },
};

export default function AdminWellness() {
  const [moods, setMoods] = useState([]);
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [moodType, setMoodType] = useState('Positive');
  const [emoji, setEmoji] = useState('');
  const [newKeyword, setNewKeyword] = useState('');

  const loadAll = async () => {
    setLoading(true);
    try {
      const [moodsRes, cfgRes] = await Promise.all([
        axiosInstance.get('/moods/all'),
        axiosInstance.get('/mood-config'),
      ]);
      setMoods(moodsRes.data?.data?.moods ?? []);
      setConfigs(cfgRes.data?.data?.configs ?? []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load wellness data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const selectedConfig = useMemo(
    () => configs.find((c) => c.moodType === moodType),
    [configs, moodType]
  );

  useEffect(() => {
    setEmoji(selectedConfig?.emoji || DEFAULTS[moodType].emoji);
  }, [selectedConfig, moodType]);

  const moodChartData = useMemo(() => {
    const byUser = new Map();
    moods.forEach((m) => {
      const key = String(m.userId);
      if (!byUser.has(key)) byUser.set(key, {});
      const c = byUser.get(key);
      c[m.mood] = (c[m.mood] || 0) + 1;
    });

    const dominantMoodCounts = MOOD_ORDER.reduce((acc, mood) => ({ ...acc, [mood]: 0 }), {});

    byUser.forEach((counts) => {
      const entries = Object.entries(counts);
      if (!entries.length) return;
      // Sort counts descending; on tie, prefer mood that comes earlier in MOOD_ORDER
      entries.sort((a, b) => {
        if (b[1] !== a[1]) return b[1] - a[1];
        return MOOD_ORDER.indexOf(a[0]) - MOOD_ORDER.indexOf(b[0]);
      });
      const topMood = entries[0][0];
      if (dominantMoodCounts[topMood] !== undefined) {
        dominantMoodCounts[topMood] += 1;
      }
    });

    return MOOD_ORDER.map((mood) => ({
      name: mood,
      value: dominantMoodCounts[mood],
    }));
  }, [moods]);

  const activeUsersCount = useMemo(
    () => new Set(moods.map((m) => String(m.userId))).size,
    [moods]
  );

  const highStressAlerts = useMemo(() => {
    const byUser = new Map();
    moods.forEach((m) => {
      const key = String(m.userId);
      if (!byUser.has(key)) byUser.set(key, {});
      const c = byUser.get(key);
      c[m.mood] = (c[m.mood] || 0) + 1;
    });

    let alerts = 0;
    byUser.forEach((counts) => {
      const entries = Object.entries(counts);
      if (!entries.length) return;
      entries.sort((a, b) => b[1] - a[1]);
      const topMood = entries[0][0];
      if (topMood === 'Low' || topMood === 'Pressure') alerts += 1;
    });
    return alerts;
  }, [moods]);

  const combinedKeywords = useMemo(() => {
    const defaults = [DEFAULTS[moodType].keyword];
    const dynamic = Array.isArray(selectedConfig?.keywords) ? selectedConfig.keywords : [];
    return [...new Set([...defaults, ...dynamic])];
  }, [selectedConfig, moodType]);

  const handlePatchConfig = async () => {
    const payload = {
      moodType,
      emoji: String(emoji || '').trim(),
      keyword: String(newKeyword || '').trim(),
    };
    if (!payload.emoji && !payload.keyword) {
      toast.error('Add emoji or keyword first');
      return;
    }

    setSaving(true);
    try {
      await axiosInstance.patch('/mood-config', payload);
      toast.success('Mood configuration updated');
      setNewKeyword('');
      await loadAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update mood config');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-sm text-gray-500">Loading wellness insights...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Wellness Insights</h2>
        <p className="text-sm text-gray-500 mt-1">System-wide mood analytics and mood keyword manager.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-sm text-gray-500">Total Active Users</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{activeUsersCount}</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-sm text-red-600">High-Stress Alerts</p>
          <p className="text-2xl font-bold text-red-700 mt-1">{highStressAlerts}</p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Real-time Mood Distribution</h3>
        <div className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={moodChartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={110}
                isAnimationActive
                animationDuration={700}
              >
                {moodChartData.map((entry) => (
                  <Cell key={entry.name} fill={MOOD_COLORS[entry.name]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Mood & Keyword Configuration</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
          {MOOD_ORDER.map((m) => (
            <div key={m} className="rounded-lg border border-gray-200 p-3 bg-gray-50">
              <p className="font-medium text-gray-800">{m}</p>
              <p className="text-gray-600 mt-1">
                {DEFAULTS[m].emoji} {DEFAULTS[m].keyword}
              </p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mood Category</label>
            <select
              value={moodType}
              onChange={(e) => setMoodType(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              {MOOD_ORDER.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Emoji</label>
            <input
              value={emoji}
              onChange={(e) => setEmoji(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              placeholder="e.g. 😊"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Append Keyword</label>
            <input
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              placeholder="e.g. Exam Stress"
            />
          </div>
        </div>

        <div>
          <p className="text-sm text-gray-600 mb-2">Current Keywords</p>
          <div className="flex flex-wrap gap-2">
            {combinedKeywords.map((k) => (
              <span key={k} className="px-2.5 py-1 rounded-full text-xs bg-primary-50 text-primary-700 border border-primary-100">
                {k}
              </span>
            ))}
          </div>
        </div>

        <button
          type="button"
          disabled={saving}
          onClick={handlePatchConfig}
          className="px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 disabled:bg-gray-300"
        >
          {saving ? 'Saving...' : 'Save Configuration'}
        </button>
      </div>
    </div>
  );
}
