import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  FiCalendar, FiCheckCircle, FiUsers,
  FiArrowRight, FiHeart, FiBookOpen, FiMessageCircle,
  FiTrendingUp, FiList, FiChevronLeft, FiChevronRight,
  FiMessageSquare, FiClock,
} from 'react-icons/fi';
import GroupChatWidgets from '../components/Dashboard/GroupChatWidgets';
import * as sessionApi from '../api/session.api';
import { bookingAPI } from '../api/booking.api';
import { eventAPI } from '../api/event.api';
import { peerSessionAPI } from '../api/peerSession.api';
import Loading from '../components/common/Loading';

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

const WELLNESS_TIPS = [
  'Take 5 deep breaths right now — inhale for 4 counts, hold for 4, exhale for 4.',
  'Drink a glass of water and step outside for 5 minutes today.',
  'Reaching out for support is a sign of strength, not weakness.',
  'Small steps every day lead to big changes over time.',
  "Your feelings are valid. It's okay to not be okay sometimes.",
  'Connect with someone you trust today — even a short message helps.',
  'Celebrate the small wins. Progress is progress, no matter how small.',
];

const COMMUNITY_GROUPS = [
  { id: 1, name: 'Anxiety Support', members: 128, tag: 'Anxiety', bg: 'bg-blue-50', border: 'border-blue-100', iconBg: 'bg-blue-100', iconColor: 'text-blue-600', dot: 'bg-blue-400' },
  { id: 2, name: 'Mindfulness Circle', members: 95, tag: 'Mindfulness', bg: 'bg-violet-50', border: 'border-violet-100', iconBg: 'bg-violet-100', iconColor: 'text-violet-600', dot: 'bg-violet-400' },
  { id: 3, name: 'Depression Support', members: 89, tag: 'Depression', bg: 'bg-indigo-50', border: 'border-indigo-100', iconBg: 'bg-indigo-100', iconColor: 'text-indigo-600', dot: 'bg-indigo-400' },
  { id: 4, name: 'Stress Management', members: 74, tag: 'Stress', bg: 'bg-green-50', border: 'border-green-100', iconBg: 'bg-green-100', iconColor: 'text-green-600', dot: 'bg-green-400' },
  { id: 5, name: 'Grief & Loss', members: 52, tag: 'Grief', bg: 'bg-amber-50', border: 'border-amber-100', iconBg: 'bg-amber-100', iconColor: 'text-amber-600', dot: 'bg-amber-400' },
  { id: 6, name: 'Young Adults', members: 110, tag: 'Community', bg: 'bg-pink-50', border: 'border-pink-100', iconBg: 'bg-pink-100', iconColor: 'text-pink-600', dot: 'bg-pink-400' },
  { id: 7, name: 'Work-Life Balance', members: 67, tag: 'Wellness', bg: 'bg-teal-50', border: 'border-teal-100', iconBg: 'bg-teal-100', iconColor: 'text-teal-600', dot: 'bg-teal-400' },
  { id: 8, name: 'Self-Esteem & Confidence', members: 83, tag: 'Growth', bg: 'bg-orange-50', border: 'border-orange-100', iconBg: 'bg-orange-100', iconColor: 'text-orange-600', dot: 'bg-orange-400' },
];

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

const STATUS_STYLES = {
  confirmed: 'bg-green-100 text-green-700',
  pending:   'bg-amber-100 text-amber-700',
  cancelled: 'bg-red-100 text-red-700',
  completed: 'bg-blue-100 text-blue-700',
};

const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : '—';

const StatCard = ({ icon: Icon, label, value, sub, iconBg, iconColor }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</p>
        <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
        {sub && (
          <p className={`text-xs mt-1.5 flex items-center gap-1 ${iconColor}`}>
            <Icon className="w-3.5 h-3.5" />
            {sub}
          </p>
        )}
      </div>
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${iconBg}`}>
        <Icon className={`w-5 h-5 ${iconColor}`} />
      </div>
    </div>
  </div>
);

const QuickActionLink = ({ to, icon: Icon, label, iconBg, iconColor }) => (
  <Link
    to={to}
    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors group"
  >
    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${iconBg}`}>
      <Icon className={`w-4 h-4 ${iconColor}`} />
    </div>
    <span className="text-sm font-medium text-gray-700 flex-1">{label}</span>
    <FiArrowRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
  </Link>
);

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [events, setEvents] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [upcomingSessions, setUpcomingSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const sliderRef = useRef(null);

  const tip = WELLNESS_TIPS[new Date().getDay() % WELLNESS_TIPS.length];

  const initials = user?.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?';

  useEffect(() => {
    if (!user?._id) return;
    const load = async () => {
      try {
        const [bRes, eRes, sRes] = await Promise.all([
          bookingAPI.getMy({ limit: 10 }),
          eventAPI.list({ status: 'published', limit: 3 }),
          peerSessionAPI.getMy({ userId: user._id }),
        ]);
        setBookings(bRes?.data?.bookings || []);
        setEvents(eRes?.data?.events || []);
        setSessions(sRes?.data?.sessions || []);
      } catch (_) {}
      setLoading(false);
    };
    load();
  }, [user?._id]);

  useEffect(() => {
    const fetchUpcomingSessions = async () => {
      try {
        setLoadingSessions(true);
        const res = await sessionApi.getUserSessions();
        if (res.success) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const upcoming = res.data
            .filter(session => {
              const sessionDate = new Date(session.sessionDate);
              sessionDate.setHours(0, 0, 0, 0);
              return session.status === 'confirmed' && sessionDate >= today;
            })
            .sort((a, b) => new Date(a.sessionDate) - new Date(b.sessionDate))
            .slice(0, 3);
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

  const handleOpenChat = (session) => {
    navigate(`/chat/${session.supporterId._id}`, { state: { session } });
  };

  const isSessionTimeAvailable = (sessionDate, sessionTime) => {
    const now = new Date();
    const [hours, minutes] = sessionTime.split(':').map(Number);
    const sessionDateTime = new Date(sessionDate);
    sessionDateTime.setHours(hours, minutes, 0, 0);
    return now >= sessionDateTime;
  };

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loading />
      </div>
    );
  }

  const completed = bookings.filter((b) => b.status === 'completed');

  const scrollEventsSlider = (dir) => {
    if (sliderRef.current) {
      sliderRef.current.scrollBy({ left: dir * 300, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Banner */}
      <div className="bg-gradient-to-br from-primary-700 via-primary-600 to-sky-500 text-white">
        <div className="container-custom pt-10 pb-20">
          <div className="flex items-center gap-4 mb-4">
            {user?.avatar?.url ? (
              <img
                src={user.avatar.url}
                alt={user.name}
                className="w-14 h-14 rounded-full border-2 border-white/40 object-cover shadow-lg"
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-white/20 border-2 border-white/30 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                {initials}
              </div>
            )}
            <div>
              <p className="text-primary-200 text-sm">{getGreeting()}</p>
              <h1 className="text-2xl font-bold tracking-tight">{user?.name}</h1>
            </div>
          </div>
          <p className="text-primary-200 text-sm max-w-md leading-relaxed">
            Your mental wellness journey continues. Here's an overview of your activity and upcoming sessions.
          </p>
        </div>
      </div>

      <div className="container-custom -mt-10 pb-12">
        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <StatCard
            icon={FiCalendar}
            label="Total Bookings"
            value={bookings.length}
            sub="All time"
            iconBg="bg-primary-50"
            iconColor="text-primary-600"
          />
          <StatCard
            icon={FiMessageCircle}
            label="Peer Sessions"
            value={sessions.length}
            sub="With peer counselors"
            iconBg="bg-green-50"
            iconColor="text-green-600"
          />
          <StatCard
            icon={FiCheckCircle}
            label="Completed"
            value={completed.length}
            sub="Sessions done"
            iconBg="bg-purple-50"
            iconColor="text-purple-600"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6 items-start">
          {/* Left column */}
          <div className="lg:col-span-2 flex flex-col gap-5">
            {/* Recent Bookings */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-semibold text-gray-900">Recent Bookings</h2>
                <Link
                  to="/booking/my"
                  className="text-primary-600 text-sm hover:text-primary-700 flex items-center gap-1 font-medium"
                >
                  View all <FiArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
              {bookings.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                    <FiCalendar className="w-7 h-7 opacity-50" />
                  </div>
                  <p className="text-sm font-medium text-gray-500">No bookings yet</p>
                  <p className="text-xs mt-1">Start by exploring available events</p>
                  <Link
                    to="/events"
                    className="mt-4 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm rounded-lg font-medium transition-colors"
                  >
                    Browse Events
                  </Link>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {bookings.slice(0, 5).map((b) => (
                    <div
                      key={b._id}
                      className="flex items-center gap-3 p-3.5 rounded-xl bg-gray-50 hover:bg-slate-100 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center flex-shrink-0">
                        <FiCalendar className="w-4 h-4 text-primary-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm truncate">
                          {b.eventId?.title || 'Session'}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">{fmtDate(b.eventId?.startDate)}</p>
                      </div>
                      <span
                        className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize flex-shrink-0 ${
                          STATUS_STYLES[b.status] || 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {b.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Upcoming Events Slider */}
            {events.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h2 className="font-semibold text-gray-900">Upcoming Events</h2>
                    <p className="text-xs text-gray-400 mt-0.5">Discover new sessions and workshops</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => scrollEventsSlider(-1)}
                      className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
                    >
                      <FiChevronLeft className="w-4 h-4 text-gray-500" />
                    </button>
                    <button
                      onClick={() => scrollEventsSlider(1)}
                      className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
                    >
                      <FiChevronRight className="w-4 h-4 text-gray-500" />
                    </button>
                    <Link to="/events" className="text-primary-600 text-sm hover:text-primary-700 flex items-center gap-1 font-medium ml-2">
                      See all <FiArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
                <div
                  ref={sliderRef}
                  className="flex gap-4 overflow-x-auto pb-2 scroll-smooth"
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                  {events.map((e) => (
                    <Link
                      key={e._id}
                      to={`/events/${e._id}`}
                      className="group flex-shrink-0 w-64 rounded-xl border border-gray-100 overflow-hidden hover:shadow-md transition-all hover:-translate-y-0.5"
                    >
                      <div className="h-36 w-full bg-primary-50 flex items-center justify-center">
                        <span className="text-primary-300 text-5xl font-bold">M</span>
                      </div>
                      <div className="p-4">
                        <p className="font-semibold text-gray-900 text-sm line-clamp-1 group-hover:text-primary-600 transition-colors">
                          {e.title}
                        </p>
                        <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                          <FiCalendar className="w-3 h-3" />
                          {fmtDate(e.startDate)}
                        </p>
                        <div className="flex items-center justify-between mt-3">
                          <span className="text-sm font-bold text-primary-600">Rs. {e.price}</span>
                          <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">
                            {e.seatsAvailable} left
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right column */}
          <div className="flex flex-col gap-5">
            {/* Daily Wellness Tip */}
            <div className="bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl p-5 text-white shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <FiHeart className="w-4 h-4 text-pink-200" />
                <span className="text-xs font-bold uppercase tracking-widest text-purple-200">
                  Daily Tip
                </span>
              </div>
              <p className="text-sm leading-relaxed text-purple-100">{tip}</p>
              <div className="mt-4 flex gap-1">
                {WELLNESS_TIPS.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1 rounded-full flex-1 ${
                      i === new Date().getDay() % WELLNESS_TIPS.length
                        ? 'bg-white'
                        : 'bg-white/25'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <h3 className="font-semibold text-gray-900 text-sm mb-3">Quick Actions</h3>
              <div className="space-y-0.5">
                <QuickActionLink to="/events" icon={FiBookOpen} label="Browse Events" iconBg="bg-primary-50" iconColor="text-primary-600" />
                <QuickActionLink to="/booking/my" icon={FiCalendar} label="My Bookings" iconBg="bg-green-50" iconColor="text-green-600" />
                <QuickActionLink to="/my-sessions" icon={FiList} label="My Sessions" iconBg="bg-sky-50" iconColor="text-sky-600" />
                <QuickActionLink to="/personal-tracking" icon={FiTrendingUp} label="Personal Tracking" iconBg="bg-teal-50" iconColor="text-teal-600" />
                <QuickActionLink to="/peer-supporters" icon={FiMessageCircle} label="Peer Supporters" iconBg="bg-amber-50" iconColor="text-amber-600" />
                <QuickActionLink to="/profile" icon={FiUsers} label="My Profile" iconBg="bg-purple-50" iconColor="text-purple-600" />
              </div>
            </div>

            {/* My Peer Sessions */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="font-semibold text-gray-900">My Peer Sessions</h2>
                  <p className="text-xs text-gray-400 mt-0.5">Chat sessions with peer counselors</p>
                </div>
                <Link
                  to="/my-sessions"
                  className="text-primary-600 text-sm hover:text-primary-700 flex items-center gap-1 font-medium"
                >
                  View all <FiArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
              {sessions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                  <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center mb-3">
                    <FiMessageCircle className="w-6 h-6 text-green-300" />
                  </div>
                  <p className="text-sm font-medium text-gray-500">No sessions yet</p>
                  <p className="text-xs mt-1">Connect with a peer counselor to start a session</p>
                  <Link
                    to="/peer-supporters"
                    className="mt-4 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg font-medium transition-colors"
                  >
                    Find a Peer Counselor
                  </Link>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {sessions.slice(0, 5).map((s) => {
                    const peer = s.peerId;
                    const peerInitial = peer?.name?.[0]?.toUpperCase() || '?';
                    const sessionDate = s.date
                      ? new Date(s.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                      : '';
                    const STATUS_DOT = { pending: 'bg-amber-400', confirmed: 'bg-green-400', completed: 'bg-blue-400', cancelled: 'bg-red-400' };
                    return (
                      <Link
                        key={s._id}
                        to="/my-sessions"
                        className="flex items-center gap-3 p-3.5 rounded-xl bg-green-50 hover:bg-green-100 transition-colors"
                      >
                        <div className="w-10 h-10 rounded-full flex-shrink-0 overflow-hidden">
                          {peer?.avatar?.url ? (
                            <img src={peer.avatar.url} alt={peer.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-green-200 flex items-center justify-center text-green-700 font-bold text-sm">
                              {peerInitial}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 text-sm truncate">
                            {peer?.name || 'Peer Counselor'}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5 truncate">{s.topic}</p>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <div className={`w-2 h-2 rounded-full ${STATUS_DOT[s.status] || 'bg-gray-300'}`} />
                          <span className="text-xs text-gray-400">{sessionDate}</span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Community Chat Groups + Welcome Banner */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <GroupChatWidgets user={user} />
          </div>
          <div className="lg:col-span-1">
            {bookings.length === 0 && (
              <div className="bg-gradient-to-r from-primary-50 to-sky-50 border border-primary-100 rounded-2xl p-6 flex items-start gap-4">
                <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                  <FiTrendingUp className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-primary-900 text-sm">Welcome to MindMate!</h3>
                  <p className="text-primary-700 text-sm mt-1 leading-relaxed">
                    You're all set. Start your journey by browsing available sessions, connecting with peer supporters, or completing your profile.
                  </p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <Link
                      to="/events"
                      className="px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white text-xs rounded-lg font-medium transition-colors"
                    >
                      Explore Events
                    </Link>
                    <Link
                      to="/profile"
                      className="px-3 py-1.5 bg-white hover:bg-primary-50 text-primary-700 border border-primary-200 text-xs rounded-lg font-medium transition-colors"
                    >
                      Complete Profile
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
