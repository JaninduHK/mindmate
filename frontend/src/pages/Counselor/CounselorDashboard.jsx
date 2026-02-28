import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiCalendar, FiDollarSign, FiStar, FiUsers, FiPlus } from 'react-icons/fi';
import axiosInstance from '../../api/axios.config';
import Loading from '../../components/common/Loading';

const StatCard = ({ icon: Icon, label, value, color }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
      </div>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
    </div>
  </div>
);

const CounselorDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await axiosInstance.get('/analytics/overview');
        if (res.data.success) setStats(res.data.data);
      } catch {}
      setLoading(false);
    };
    fetch();
  }, []);

  if (loading) return <div className="flex justify-center py-16"><Loading /></div>;

  return (
    <div className="container-custom py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Counselor Dashboard</h1>
        <Link
          to="/counselor/events/create"
          className="flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
        >
          <FiPlus className="w-4 h-4" />
          <span>New Event</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={FiCalendar} label="Total Bookings" value={stats?.totalBookings ?? '—'} color="bg-primary-500" />
        <StatCard icon={FiUsers} label="Confirmed" value={stats?.confirmedBookings ?? '—'} color="bg-green-500" />
        <StatCard icon={FiDollarSign} label="Total Earnings" value={stats?.totalRevenue !== undefined ? `Rs. ${stats.totalRevenue.toFixed(2)}` : '—'} color="bg-blue-500" />
        <StatCard icon={FiStar} label="Rating" value={stats?.rating ? `${stats.rating.toFixed(1)} (${stats.reviewCount})` : '—'} color="bg-yellow-500" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link to="/counselor/events" className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
          <h3 className="font-semibold text-gray-900 mb-1">Manage Events</h3>
          <p className="text-sm text-gray-500">View, edit, and manage your published sessions and workshops.</p>
        </Link>
        <Link to="/counselor/analytics" className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
          <h3 className="font-semibold text-gray-900 mb-1">Analytics</h3>
          <p className="text-sm text-gray-500">View booking trends and revenue charts.</p>
        </Link>
        <Link to="/counselor/profile" className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
          <h3 className="font-semibold text-gray-900 mb-1">Profile</h3>
          <p className="text-sm text-gray-500">Update your bio, specializations, and certifications.</p>
        </Link>
        <Link to="/counselor/withdrawals" className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
          <h3 className="font-semibold text-gray-900 mb-1">Withdrawals</h3>
          <p className="text-sm text-gray-500">Check your available balance and request a payout to your bank account.</p>
        </Link>
      </div>
    </div>
  );
};

export default CounselorDashboard;
