import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { FiUser, FiActivity, FiCalendar } from 'react-icons/fi';

const Dashboard = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container-custom">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.name}!
          </h1>
          <p className="text-gray-600 mt-2">
            Here's your mental wellness overview
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {/* Stats Cards */}

          <Link to="/peer-supporters" className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-lg transition-shadow block">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Get Support</p>
              </div>
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                <FiUser className="w-6 h-6 text-primary-600" />
              </div>
            </div>
          </Link>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Profile Complete</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">75%</p>
              </div>
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                <FiUser className="w-6 h-6 text-primary-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Activity Score</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">0</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <FiActivity className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Days Active</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">1</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <FiCalendar className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Quick Actions
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            <Link to="/content-library" className="p-4 border-2 border-gray-200 rounded-lg hover:border-primary-500 transition-colors text-left block">
              <h3 className="font-semibold text-gray-900">📚 Content Library</h3>
              <p className="text-gray-600 text-sm mt-1">
                Explore expert-curated mental health resources
              </p>
            </Link>
            <Link to="/emergency-contacts" className="p-4 border-2 border-gray-200 rounded-lg hover:border-primary-500 transition-colors text-left block">
              <h3 className="font-semibold text-gray-900">🚨 Emergency Contacts</h3>
              <p className="text-gray-600 text-sm mt-1">
                Manage your emergency contacts
              </p>
            </Link>
            <Link to="/booking/my" className="p-4 border-2 border-gray-200 rounded-lg hover:border-primary-500 transition-colors text-left block">
              <h3 className="font-semibold text-gray-900">My Bookings</h3>
              <p className="text-gray-600 text-sm mt-1">
                View and manage your upcoming sessions
              </p>
            </Link>
            <Link to="/personal-tracking" className="p-4 border-2 border-gray-200 rounded-lg hover:border-primary-500 transition-colors text-left block">
              <h3 className="font-semibold text-gray-900">Personal Tracker</h3>
              <p className="text-gray-600 text-sm mt-1">
                Manage your mood history and daily goals
              </p>
            </Link>
            <Link to="/events" className="p-4 border-2 border-gray-200 rounded-lg hover:border-primary-500 transition-colors text-left block">
              <h3 className="font-semibold text-gray-900">Browse Events</h3>
              <p className="text-gray-600 text-sm mt-1">
                Find sessions and workshops near you
              </p>
            </Link>
            <Link to="/profile" className="p-4 border-2 border-gray-200 rounded-lg hover:border-primary-500 transition-colors text-left block">
              <h3 className="font-semibold text-gray-900">⚙️ Settings</h3>
              <p className="text-gray-600 text-sm mt-1">
                Manage GPS and alert preferences
              </p>
            </Link>
          </div>
        </div>

        {/* Welcome Message */}
        <div className="mt-8 bg-primary-50 border border-primary-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-primary-900 mb-2">
            Welcome to MindMate! 🎉
          </h3>
          <p className="text-primary-800">
            This is your personal dashboard. As you use the app, you'll see your
            progress, insights, and personalized recommendations here. Start by
            completing your profile and exploring the resources available.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
