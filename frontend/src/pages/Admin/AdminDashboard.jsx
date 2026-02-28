import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiUsers, FiCalendar, FiDollarSign, FiSettings } from 'react-icons/fi';
import { adminAPI } from '../../api/admin.api';
import Loading from '../../components/common/Loading';

const AdminDashboard = () => {
  const [earnings, setEarnings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAPI.getEarnings().then((res) => {
      if (res.success) setEarnings(res.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-16"><Loading /></div>;

  return (
    <div className="container-custom py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Admin Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <p className="text-sm text-gray-500">Total Revenue</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">${earnings?.totalRevenue?.toFixed(2) ?? '—'}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <p className="text-sm text-gray-500">Platform Earnings</p>
          <p className="text-2xl font-bold text-primary-600 mt-1">${earnings?.platformEarnings?.toFixed(2) ?? '—'}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <p className="text-sm text-gray-500">Counselor Earnings</p>
          <p className="text-2xl font-bold text-green-600 mt-1">${earnings?.counselorEarnings?.toFixed(2) ?? '—'}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { to: '/admin/users', icon: FiUsers, label: 'Users', desc: 'Manage all user accounts' },
          { to: '/admin/counselors', icon: FiUsers, label: 'Counselors', desc: 'Verify or suspend counselors' },
          { to: '/admin/events', icon: FiCalendar, label: 'Events', desc: 'Manage all events and sessions' },
          { to: '/admin/bookings', icon: FiCalendar, label: 'Bookings', desc: 'View all bookings' },
          { to: '/admin/earnings', icon: FiDollarSign, label: 'Earnings', desc: 'Revenue analytics' },
          { to: '/admin/config', icon: FiSettings, label: 'Settings', desc: 'Platform commission rate' },
        ].map(({ to, icon: Icon, label, desc }) => (
          <Link key={to} to={to} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
            <Icon className="w-6 h-6 text-primary-600 mb-2" />
            <h3 className="font-semibold text-gray-900">{label}</h3>
            <p className="text-sm text-gray-500 mt-0.5">{desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboard;
