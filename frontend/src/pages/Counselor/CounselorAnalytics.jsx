import { useState, useEffect } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import axiosInstance from '../../api/axios.config';
import Loading from '../../components/common/Loading';

const CounselorAnalytics = () => {
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await axiosInstance.get(`/analytics/bookings?days=${days}`);
        if (res.data.success) setTrends(res.data.data.trends);
      } catch {}
      setLoading(false);
    };
    fetch();
  }, [days]);

  return (
    <div className="container-custom py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <select
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loading /></div>
      ) : trends.length === 0 ? (
        <div className="text-center py-16 text-gray-400">No booking data yet</div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h2 className="font-semibold text-gray-900 mb-4">Bookings Over Time</h2>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={trends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#0284c7" strokeWidth={2} dot={false} name="Bookings" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h2 className="font-semibold text-gray-900 mb-4">Revenue Over Time ($)</h2>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={trends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v) => `$${v.toFixed(2)}`} />
                <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} dot={false} name="Revenue" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};

export default CounselorAnalytics;
