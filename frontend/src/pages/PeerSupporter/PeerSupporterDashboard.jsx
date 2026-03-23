import { Link } from 'react-router-dom';
import { FiUsers, FiMessageCircle, FiHeart, FiBookOpen, FiAward } from 'react-icons/fi';
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Link to="/peer-supporter/users" className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">People Needing Support</h3>
              <p className="text-sm text-gray-500 mt-1">Connect with users and provide support</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
              <FiUsers className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Link>

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
      </div>

      <div>
        <Link
          to="/counselor/onboarding"
          className="flex items-start space-x-3 p-5 border-2 border-primary-200 bg-primary-50 rounded-xl hover:border-primary-500 transition-colors"
        >
          <FiAward className="w-5 h-5 text-primary-600 mt-0.5 shrink-0" />
          <div>
            <h3 className="font-semibold text-primary-900">Become a Professional Counselor</h3>
            <p className="text-primary-700 text-sm mt-1">
              Take the next step — register as a certified counselor and start publishing professional sessions.
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default PeerSupporterDashboard;
