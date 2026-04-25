import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiUsers, FiMessageCircle, FiHeart, FiBookOpen, FiAward, FiClock, FiStar, FiCalendar, FiTrendingUp } from 'react-icons/fi';
import { useAuth } from '../../hooks/useAuth';
import socket from '../../socket/socket';
import GroupChatWidgets from '../../components/Dashboard/GroupChatWidgets';
import AvailabilityToggle from '../../components/peer/AvailabilityToggle';
import PeerSessionManagement from '../../components/PeerSupporter/PeerSessionManagement';
import * as sessionApi from '../../api/session.api';

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
};

const StatCard = ({ icon: Icon, label, value, colorClass }) => (
  <div className="bg-white border border-gray-100 rounded-2xl p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
    <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center shrink-0 ${colorClass}`}>
      <Icon className="w-6 h-6" />
    </div>
    <div>
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  </div>
);

const ActionCard = ({ to, icon: Icon, title, description, colorClass }) => (
  <Link 
    to={to} 
    className="bg-white border border-gray-100 rounded-2xl p-5 flex items-start gap-4 hover:shadow-md hover:border-primary-200 transition-all group"
  >
    <div className={`p-3 rounded-xl shrink-0 transition-transform group-hover:scale-105 ${colorClass}`}>
      <Icon className="w-6 h-6" />
    </div>
    <div>
      <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors mb-1">{title}</h3>
      <p className="text-sm text-gray-500 leading-relaxed line-clamp-2">{description}</p>
    </div>
  </Link>
);

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

const PeerSupporterDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isAvailable, setIsAvailable] = useState(user?.isAvailableNow || false);
  const [upcomingSessions, setUpcomingSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(false);

  // Join personal room to receive notifications
  useEffect(() => {
    if (user?._id) {
      socket.emit('join_room', user._id);
      console.log('✅ Peer supporter joined personal room:', user._id);
    }
  }, [user?._id]);

  // Fetch upcoming confirmed sessions
  useEffect(() => {
    const fetchUpcomingSessions = async () => {
      try {
        setLoadingSessions(true);
        const res = await sessionApi.getSupporterBookings();
        
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
    navigate(`/chat/${session.userId._id}`, { state: { session } });
  };

  // Check if session time has arrived
  const isSessionTimeAvailable = (sessionDate, sessionTime) => {
    const now = new Date();
    const [hours, minutes] = sessionTime.split(':').map(Number);
    
    const sessionDateTime = new Date(sessionDate);
    sessionDateTime.setHours(hours, minutes, 0, 0);
    
    return now >= sessionDateTime;
  };

  const handleAvailabilityChange = (newStatus) => {
    setIsAvailable(newStatus);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-12 font-sans">
      
      {/* Redesigned Header Banner */}
      <div className="bg-white border-b border-gray-200 pt-8 pb-8 mb-8 shadow-sm">
        <div className="container-custom">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 bg-primary-50 text-primary-700 px-3 py-1 rounded-full text-xs font-bold mb-3 uppercase tracking-wider">
                <FiStar className="w-3.5 h-3.5" /> Peer Counselor
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">
                {getGreeting()}, <span className="text-primary-600">{user?.name?.split(' ')[0] || 'Counselor'}</span>!
              </h1>
              <p className="text-gray-500 mt-2 text-base max-w-2xl">
                Here's what's happening with your support sessions and community groups today.
              </p>
            </div>
            
            {/* Minimalist Availability Card */}
            <div className={`bg-white p-4 rounded-2xl border ${isAvailable ? 'border-green-200 shadow-sm' : 'border-gray-200'} flex items-center justify-between gap-6 min-w-[280px] shrink-0`}>
              <div>
                <p className="text-sm font-bold text-gray-800 mb-0.5 flex items-center gap-2">
                  Status 
                  {isAvailable && (
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                  )}
                </p>
                <p className="text-xs font-medium text-gray-500">
                  {isAvailable ? "Visible to users" : "Currently offline"}
                </p>
              </div>
              <div className="scale-105">
                <AvailabilityToggle isAvailableNow={isAvailable} onStatusChange={handleAvailabilityChange} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container-custom">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard icon={FiUsers} label="People Helped" value="12" colorClass="bg-teal-50 text-teal-600" />
          <StatCard icon={FiMessageCircle} label="Hours Logged" value="24" colorClass="bg-primary-50 text-primary-600" />
          <StatCard icon={FiHeart} label="Support Rating" value="4.9" colorClass="bg-rose-50 text-rose-600" />
          <StatCard icon={FiBookOpen} label="Resources Shared" value="8" colorClass="bg-amber-50 text-amber-600" />
        </div>

        {/* Dashboard Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Content Area (Spans 2 columns on lg screens) */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Quick Tools Grid */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-600">
                  <FiAward className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Counselor Tools</h2>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <ActionCard 
                  to="/peer-supporter/users" 
                  icon={FiUsers} 
                  title="Needs Support" 
                  description="Find users actively looking for a listening ear."
                  colorClass="bg-green-50 text-green-600"
                />
                <ActionCard 
                  to="/peer-supporter/manage-availability" 
                  icon={FiCalendar} 
                  title="Availability" 
                  description="Manage the time slots when you're free to chat."
                  colorClass="bg-primary-50 text-primary-600"
                />
                <ActionCard 
                  to="/peer-supporter/sessions" 
                  icon={FiClock} 
                  title="My Sessions" 
                  description="Review upcoming scheduled support sessions."
                  colorClass="bg-cyan-50 text-cyan-600"
                />
                <ActionCard 
                  to="#" 
                  icon={FiBookOpen} 
                  title="Resources" 
                  description="Access templates and guides to share with peers."
                  colorClass="bg-amber-50 text-amber-600"
                />
              </div>
            </div>

            {/* Session Bookings Management */}
            <PeerSessionManagement />

            {/* Community Chat Groups */}
            <GroupChatWidgets user={user} />
          </div>

          {/* Sidebar Area (Spans 1 column on lg screens) */}
          <div className="lg:col-span-1 space-y-8">
            
            {/* Upcoming Schedule Panel */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-bold text-gray-900">Upcoming</h2>
                <Link to="/peer-supporter/sessions" className="text-sm font-semibold text-primary-600 hover:text-primary-700 bg-primary-50 px-3 py-1 rounded-lg transition-colors">
                  View All
                </Link>
              </div>
              
              <div className="space-y-0">
                {loadingSessions ? (
                  <div className="text-center py-4 text-gray-400 text-sm">Loading sessions...</div>
                ) : upcomingSessions.length === 0 ? (
                  <div className="text-center py-4 text-gray-400 text-sm">No upcoming sessions scheduled</div>
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
                          icon={FiMessageCircle} 
                          title={`Chat with ${session.userId?.name || 'User'}`}
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

              <div className="mt-8 p-4 bg-indigo-50/50 rounded-xl border border-indigo-100 flex gap-4">
                <div className="shrink-0 text-indigo-500 mt-0.5">
                  <FiTrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-indigo-900 mb-1">Weekly Tip</h4>
                  <p className="text-xs text-indigo-700 leading-relaxed">
                    Remember to practice active listening. Sometimes people just need to be heard without judgment.
                  </p>
                </div>
              </div>
            </div>

            {/* Upgrade Banner Panel */}
            <div className="bg-gradient-to-b from-primary-900 to-gray-900 rounded-2xl p-8 border border-gray-800 shadow-lg relative overflow-hidden group text-center">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary-500/20 rounded-full blur-2xl"></div>
              
              <div className="relative z-10 flex flex-col items-center">
                <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center mb-5 shadow-inner">
                  <FiAward className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Elevate your impact</h3>
                <p className="text-primary-100/80 text-sm leading-relaxed mb-6 font-medium">
                  Register as a professional counselor to publish structured sessions and earn from your expertise.
                </p>
                <Link
                  to="/counselor/onboarding"
                  className="w-full py-3 bg-white text-primary-900 font-bold rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
                >
                  Become a Counselor
                </Link>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default PeerSupporterDashboard;
