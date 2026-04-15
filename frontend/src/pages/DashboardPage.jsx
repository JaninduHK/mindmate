import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { TrendingUp, AlertCircle, BookOpen, Users, Zap, MessageCircle, Award, BarChart3 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth.js';
import { useEmergency } from '../context/EmergencyContext.jsx';
import Button from '../components/common/Button.jsx';

const DashboardPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isEmergencyActive } = useEmergency();

  // Quick action items
  const quickActions = [
    {
      id: 'emergency-contacts',
      title: 'Emergency Contacts',
      description: 'Manage people to notify',
      icon: Users,
      color: 'bg-red-50 text-red-600',
      borderColor: 'border-red-200',
      action: () => navigate('/emergency-contacts'),
    },
    {
      id: 'content-library',
      title: 'Content Library',
      description: 'Explore wellness resources',
      icon: BookOpen,
      color: 'bg-blue-50 text-blue-600',
      borderColor: 'border-blue-200',
      action: () => navigate('/content-library'),
    },
    {
      id: 'notifications',
      title: 'Notifications',
      description: 'Check updates',
      icon: AlertCircle,
      color: 'bg-yellow-50 text-yellow-600',
      borderColor: 'border-yellow-200',
      action: () => navigate('/notifications'),
    },
  ];

  return (
    <>
      <Helmet>
        <title>Dashboard - MindMate</title>
      </Helmet>

      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container-custom">
          {/* Welcome Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome back, {user?.name?.split(' ')[0]}! 👋
            </h1>
            <p className="text-gray-600 mt-2">
              Here's your wellness summary for today
            </p>
          </div>

          {/* Emergency Status Alert */}
          {isEmergencyActive && (
            <div className="mb-8 bg-red-50 border-2 border-red-200 rounded-2xl p-6 flex items-start gap-4">
              <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-red-900">Emergency Mode Active</h3>
                <p className="text-sm text-red-800 mt-1">
                  Your emergency contacts have been notified. Support is on the way.
                </p>
              </div>
            </div>
          )}

          {/* Main Dashboard Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Mood Card */}
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-gray-600">Today's Mood</p>
                <MessageCircle className="w-5 h-5 text-primary-600" />
              </div>
              <p className="text-3xl font-bold text-gray-900 mb-2">Good 😊</p>
              <p className="text-xs text-gray-500">
                Feeling grateful for small moments
              </p>
            </div>

            {/* Activity Card */}
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-gray-600">Activity</p>
                <TrendingUp className="w-5 h-5 text-teal-600" />
              </div>
              <p className="text-3xl font-bold text-gray-900 mb-2">Moderate</p>
              <p className="text-xs text-gray-500">
                2 hours wellness activities
              </p>
            </div>

            {/* Goals Card */}
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-gray-600">Active Goals</p>
                <Award className="w-5 h-5 text-amber-600" />
              </div>
              <p className="text-3xl font-bold text-gray-900 mb-2">3</p>
              <p className="text-xs text-gray-500">
                2 on track, 1 needs attention
              </p>
            </div>

            {/* Sessions Card */}
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-gray-600">Sessions</p>
                <BarChart3 className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-3xl font-bold text-gray-900 mb-2">12</p>
              <p className="text-xs text-gray-500">
                Total wellness sessions
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              Quick Actions
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {quickActions.map((action) => {
                const IconComponent = action.icon;
                return (
                  <button
                    key={action.id}
                    onClick={action.action}
                    className={`rounded-2xl border-2 p-6 text-left transition-all hover:shadow-md ${action.color} ${action.borderColor}`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <IconComponent className="w-6 h-6" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-1">
                      {action.title}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {action.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Wellness Tips */}
          <div className="bg-gradient-to-r from-primary-50 to-teal-50 rounded-2xl border border-primary-200 p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Daily Wellness Tip ✨
            </h2>
            <p className="text-gray-700 mb-4">
              Take a moment to practice deep breathing. Inhale for 4 counts, hold for 4, exhale for 4. This simple technique can help reduce stress and improve focus.
            </p>
            <Button onClick={() => navigate('/content-library')}>
              <BookOpen className="w-4 h-4 mr-2" />
              Explore Resources
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default DashboardPage;
