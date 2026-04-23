import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { FiUser, FiActivity, FiCalendar, FiMessageSquare, FiClock } from 'react-icons/fi';
import GroupChatWidgets from '../components/Dashboard/GroupChatWidgets';
import * as sessionApi from '../api/session.api';

const TimelineItem = ({ icon: Icon, title, time, isLast }) => (
  <div className="relative flex gap-4 pb-6">
    {!isLast && <div className="absolute left-5 top-10 bottom-0 w-0.5 bg-gray-100" />}
    <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center shrink-0 border-4 border-white shadow-sm z-10 relative">
      <Icon className="w-4 h-4 text-primary-600" />
    </div>
    <div className="pt-2">
      <p className="text-sm font-semibold text-gray-900">{title}</p>
      <p className="text-xs text-gray-500 mt-1 flex items-center gap-1.5">
        <FiClock className="w-3 h-3" /> {time}
      </p>
    </div>
  </div>
);

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [upcomingSessions, setUpcomingSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(false);

  // Fetch upcoming confirmed sessions
  useEffect(() => {
    const fetchUpcomingSessions = async () => {
      try {
        setLoadingSessions(true);
        const res = await sessionApi.getUserSessions();
        
        if (res.success) {
          // Filter for confirmed sessions that are today or in the future
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          const upcoming = res.data
            .filter(session => {
              const sessionDate = new Date(session.sessionDate);
              sessionDate.setHours(0, 0, 0, 0);
              return session.status === 'confirmed' && sessionDate >= today;
            })
            .sort((a, b) => new Date(a.sessionDate) - new Date(b.sessionDate))
            .slice(0, 3); // Only show top 3
          
          setUpcomingSessions(upcoming);
        }
      } catch (error) {
        console.error('Error fetching upcoming sessions:', error);
      } finally {
        setLoadingSessions(false);
      }
    };

    fetchUpcomingSessions();
  }, []);

  // Format session date and time for display
  const formatSessionDateTime = (sessionDate, sessionTime) => {
    const date = new Date(sessionDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);

    const isToday = date.getTime() === today.getTime();
    const isTomorrow = date.getTime() === new Date(today.getTime() + 86400000).getTime();

    let dateStr = '';
    if (isToday) {
      dateStr = 'Today';
    } else if (isTomorrow) {
      dateStr = 'Tomorrow';
    } else {
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      dateStr = days[date.getDay()];
    }

    return `${dateStr}, ${sessionTime}`;
  };

  // Handle opening chat session
  const handleOpenChat = (session) => {
    navigate(`/chat/${session.supporterId._id}`, { state: { session } });
  };

  // Check if session time has arrived
  const isSessionTimeAvailable = (sessionDate, sessionTime) => {
    const now = new Date();
    const [hours, minutes] = sessionTime.split(':').map(Number);
    
    const sessionDateTime = new Date(sessionDate);
    sessionDateTime.setHours(hours, minutes, 0, 0);
    
    return now >= sessionDateTime;
  };

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

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content Area (Spans 2 columns on lg screens) */}
          <div className="lg:col-span-2 space-y-8">
            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Quick Actions
              </h2>
              <div className="grid md:grid-cols-3 gap-4">
                <Link to="/events" className="p-4 border-2 border-gray-200 rounded-lg hover:border-primary-500 transition-colors text-left block">
                  <h3 className="font-semibold text-gray-900">Browse Events</h3>
                  <p className="text-gray-600 text-sm mt-1">
                    Find sessions and workshops near you
                  </p>
                </Link>
                <Link to="/booking/my" className="p-4 border-2 border-gray-200 rounded-lg hover:border-primary-500 transition-colors text-left block">
                  <h3 className="font-semibold text-gray-900">My Bookings</h3>
                  <p className="text-gray-600 text-sm mt-1">
                    View and manage your upcoming sessions
                  </p>
                </Link>
                <Link to="/my-sessions" className="p-4 border-2 border-blue-200 rounded-lg hover:border-primary-500 transition-colors text-left block bg-blue-50">
                  <div className="flex items-center gap-2">
                    <FiMessageSquare className="w-5 h-5 text-blue-600" />
                    <h3 className="font-semibold text-gray-900">Chat Sessions</h3>
                  </div>
                  <p className="text-gray-600 text-sm mt-1">
                    View upcoming sessions & chat with counselors
                  </p>
                </Link>
              </div>
            </div>

            {/* Community Chat Groups */}
            <div className="mb-8">
              <GroupChatWidgets user={user} />
            </div>
          </div>

          {/* Sidebar Area (Spans 1 column on lg screens) */}
          <div className="lg:col-span-1 space-y-8">
            {/* Upcoming Sessions Reminders Sidebar */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Upcoming
                </h2>
                <Link to="/booking/my" className="text-sm font-semibold text-primary-600 hover:text-primary-700 bg-primary-50 px-3 py-1 rounded-lg transition-colors">
                  View All
                </Link>
              </div>
              
              <div className="space-y-0">
                {loadingSessions ? (
                  <div className="text-center py-4 text-gray-400 text-sm">Loading...</div>
                ) : upcomingSessions.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-gray-400 text-sm mb-3">No upcoming sessions</p>
                    <Link to="/peer-supporters" className="inline-block px-3 py-1.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-xs font-medium">
                      Book Now
                    </Link>
                  </div>
                ) : (
                  upcomingSessions.map((session, idx) => {
                    const isTimeAvailable = isSessionTimeAvailable(session.sessionDate, session.sessionTime);
                    
                    return (
                      <button
                        key={session._id}
                        onClick={() => isTimeAvailable && handleOpenChat(session)}
                        disabled={!isTimeAvailable}
                        className={`w-full text-left transition-colors ${
                          isTimeAvailable 
                            ? 'hover:bg-gray-50 cursor-pointer' 
                            : 'cursor-not-allowed opacity-60'
                        }`}
                        title={!isTimeAvailable ? 'Chat will be available at session time' : 'Click to open chat'}
                      >
                        <TimelineItem 
                          icon={FiMessageSquare} 
                          title={`Chat with ${session.supporterId?.name || 'Counselor'}`}
                          time={formatSessionDateTime(session.sessionDate, session.sessionTime)}
                          isLast={idx === upcomingSessions.length - 1}
                        />
                        {!isTimeAvailable && (
                          <p className="text-xs text-gray-400 ml-14 -mt-1">Available at {session.sessionTime}</p>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
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
