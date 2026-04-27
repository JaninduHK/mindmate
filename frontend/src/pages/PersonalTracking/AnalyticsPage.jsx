import { useCallback, useEffect, useMemo, useState } from 'react';
import axiosInstance from '../../api/axios.config';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';

import AnalyticsSummary from '../../components/personalTracking/AnalyticsSummary';
import AdminWellnessDashboard from '../../components/personalTracking/AdminWellnessDashboard';

export default function AnalyticsPage() {
  const { user } = useAuth();

  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  // Current month bounds — computed once
  const { monthStart, monthEnd } = useMemo(() => {
    const now = new Date();
    const y = now.getUTCFullYear();
    const m = String(now.getUTCMonth() + 1).padStart(2, '0');
    const d = String(now.getUTCDate()).padStart(2, '0');
    return {
      monthStart: `${y}-${m}-01`,
      monthEnd:   `${y}-${m}-${d}`,
    };
  }, []);

  const loadSummary = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/personal-tracking/analytics/summary', {
        params: { startDate: monthStart, endDate: monthEnd },
      });
      setSummary(res.data?.data ?? null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }, [monthStart, monthEnd]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="text-center">
        <p className="text-4xs font-bold uppercase tracking-wider text-primary-600">
          Analytics & Insights
        </p>
        <h2 className="text-2xl font-bold text-gray-900 mt-1">
          Mood and goal insights
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Showing current month summary ({monthStart} → {monthEnd}).
        </p>
      </div>

      {/* Analytics Cards */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="bg-white rounded-xl shadow-sm p-8">
            <div className="flex flex-col items-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-200 border-t-primary-600"></div>
              <p className="text-sm text-gray-500">Loading your analytics...</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-shadow hover:shadow-md">
          <div className="p-6">
            <AnalyticsSummary analytics={summary} />
          </div>
        </div>
      )}

      {/* Admin Dashboard (only visible to admins) */}
      {user?.role === 'admin' && (
        <div className="mt-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-shadow hover:shadow-md">
            <div className="p-6">
              <AdminWellnessDashboard />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}