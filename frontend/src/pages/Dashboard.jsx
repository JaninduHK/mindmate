import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FiCalendar, FiCheckCircle, FiClock, FiUsers,
  FiArrowRight, FiHeart, FiBookOpen, FiMessageCircle,
  FiStar, FiTrendingUp,
} from 'react-icons/fi';
import { useAuth } from '../hooks/useAuth';
import { bookingAPI } from '../api/booking.api';
import { eventAPI } from '../api/event.api';
import Loading from '../components/common/Loading';

const WELLNESS_TIPS = [
  'Take 5 deep breaths right now — inhale for 4 counts, hold for 4, exhale for 4.',
  'Drink a glass of water and step outside for 5 minutes today.',
  'Reaching out for support is a sign of strength, not weakness.',
  'Small steps every day lead to big changes over time.',
  "Your feelings are valid. It's okay to not be okay sometimes.",
  'Connect with someone you trust today — even a short message helps.',
  'Celebrate the small wins. Progress is progress, no matter how small.',
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

// ── Sub-components ────────────────────────────────────────────────────────────

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

// ── Main Component ────────────────────────────────────────────────────────────

const Dashboard = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const tip = WELLNESS_TIPS[new Date().getDay() % WELLNESS_TIPS.length];

  const initials = user?.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?';

  useEffect(() => {
    const load = async () => {
      try {
        const [bRes, eRes] = await Promise.all([
          bookingAPI.getMy({ limit: 10 }),
          eventAPI.list({ status: 'published', limit: 3 }),
        ]);
        setBookings(bRes?.data?.bookings || []);
        setEvents(eRes?.data?.events || []);
      } catch (_) {}
      setLoading(false);
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loading />
      </div>
    );
  }

  const now = new Date();
  const upcoming = bookings.filter(
    (b) => b.status === 'confirmed' && new Date(b.eventId?.startDate) > now
  );
  const completed = bookings.filter((b) => b.status === 'completed');

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ── Hero Banner ─────────────────────────────────────────────────── */}
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
        {/* ── Stat Cards ────────────────────────────────────────────────── */}
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
            icon={FiClock}
            label="Upcoming Sessions"
            value={upcoming.length}
            sub="Confirmed"
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

        {/* ── Main Content Grid ─────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Recent Bookings */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
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
                <QuickActionLink
                  to="/events"
                  icon={FiBookOpen}
                  label="Browse Events"
                  iconBg="bg-primary-50"
                  iconColor="text-primary-600"
                />
                <QuickActionLink
                  to="/booking/my"
                  icon={FiCalendar}
                  label="My Bookings"
                  iconBg="bg-green-50"
                  iconColor="text-green-600"
                />
                <QuickActionLink
                  to="/peer-supporters"
                  icon={FiMessageCircle}
                  label="Peer Support"
                  iconBg="bg-amber-50"
                  iconColor="text-amber-600"
                />
                <QuickActionLink
                  to="/profile"
                  icon={FiUsers}
                  label="My Profile"
                  iconBg="bg-purple-50"
                  iconColor="text-purple-600"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── Upcoming Events ───────────────────────────────────────────── */}
        {events.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-semibold text-gray-900">Upcoming Events</h2>
                <p className="text-xs text-gray-400 mt-0.5">Discover new sessions and workshops</p>
              </div>
              <Link
                to="/events"
                className="text-primary-600 text-sm hover:text-primary-700 flex items-center gap-1 font-medium"
              >
                See all <FiArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {events.map((e) => (
                <Link
                  key={e._id}
                  to={`/events/${e._id}`}
                  className="group rounded-xl border border-gray-100 overflow-hidden hover:shadow-md transition-all hover:-translate-y-0.5"
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

        {/* ── Welcome Banner (new users with no bookings) ───────────────── */}
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
  );
};

export default Dashboard;
