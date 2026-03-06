import { FiUsers, FiMessageCircle, FiHeart, FiBookOpen } from 'react-icons/fi';
import { useAuth } from '../../hooks/useAuth';

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

const PeerSupporterDashboard = () => {
  const { user } = useAuth();

  return (
    <div className="container-custom py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Peer Supporter Dashboard</h1>
        <p className="text-gray-500 mt-1">Welcome back, {user?.name}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={FiUsers} label="People Helped" value="—" color="bg-teal-500" />
        <StatCard icon={FiMessageCircle} label="Sessions" value="—" color="bg-primary-500" />
        <StatCard icon={FiHeart} label="Support Given" value="—" color="bg-rose-500" />
        <StatCard icon={FiBookOpen} label="Resources Shared" value="—" color="bg-amber-500" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-900 mb-1">My Profile</h3>
          <p className="text-sm text-gray-500">Update your bio, availability, and areas of support.</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-900 mb-1">Support Sessions</h3>
          <p className="text-sm text-gray-500">View and manage your upcoming peer support sessions.</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-900 mb-1">Resources</h3>
          <p className="text-sm text-gray-500">Browse mental wellness resources to share with others.</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-900 mb-1">Community</h3>
          <p className="text-sm text-gray-500">Connect with other peer supporters and counselors.</p>
        </div>
      </div>
    </div>
  );
};

export default PeerSupporterDashboard;
