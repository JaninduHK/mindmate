import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiCalendar, FiClock, FiMessageSquare, FiMessageCircle } from 'react-icons/fi';
import { useAuth } from '../../hooks/useAuth';
import { peerSessionAPI } from '../../api/peerSession.api';
import Loading from '../../components/common/Loading';
import toast from 'react-hot-toast';

const STATUS_TABS = ['All', 'Pending', 'Confirmed', 'Completed', 'Cancelled'];

const STATUS_BORDER = {
  pending:   'border-l-amber-400',
  confirmed: 'border-l-green-400',
  completed: 'border-l-blue-400',
  cancelled: 'border-l-red-400',
};

const STATUS_BADGE = {
  pending:   'bg-amber-100 text-amber-700',
  confirmed: 'bg-green-100 text-green-700',
  completed: 'bg-blue-100 text-blue-700',
  cancelled: 'bg-red-100 text-red-700',
};

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' }) : '—';

const MySessionsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [statusCounts, setStatusCounts] = useState({ pending: 0, confirmed: 0, completed: 0, cancelled: 0 });
  const [activeTab, setActiveTab] = useState('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?._id) return;
    const load = async () => {
      try {
        const res = await peerSessionAPI.getMy({ userId: user._id });
        setSessions(res?.data?.sessions || []);
        setStatusCounts(res?.data?.statusCounts || { pending: 0, confirmed: 0, completed: 0, cancelled: 0 });
      } catch {
        toast.error('Failed to load sessions');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user?._id]);

  const handleCancel = async (sessionId) => {
    try {
      await peerSessionAPI.updateStatus(sessionId, { status: 'cancelled' });
      setSessions((prev) =>
        prev.map((s) => (s._id === sessionId ? { ...s, status: 'cancelled' } : s))
      );
      setStatusCounts((prev) => ({
        ...prev,
        cancelled: prev.cancelled + 1,
        pending: Math.max(0, prev.pending - 1),
      }));
      toast.success('Session cancelled');
    } catch {
      toast.error('Failed to cancel session');
    }
  };

  const filtered =
    activeTab === 'All'
      ? sessions
      : sessions.filter((s) => s.status === activeTab.toLowerCase());

  const totalCount = sessions.length;

  const tabCount = (tab) => {
    if (tab === 'All') return totalCount;
    return statusCounts[tab.toLowerCase()] ?? 0;
  };

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loading />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container-custom py-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Sessions</h1>
          <p className="text-gray-500 mt-1">View and manage your booked peer counseling sessions</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-gray-200 mb-8 overflow-x-auto">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab
                  ? 'border-b-2 border-primary-600 text-primary-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab}
              <span
                className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                  activeTab === tab ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-500'
                }`}
              >
                {tabCount(tab)}
              </span>
            </button>
          ))}
        </div>

        {/* Session List */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <FiCalendar className="w-7 h-7 opacity-50" />
            </div>
            <p className="text-base font-medium text-gray-500">No sessions found</p>
            <p className="text-sm mt-1 text-gray-400">
              {activeTab === 'All'
                ? 'Book a session with a peer counselor to get started'
                : `No ${activeTab.toLowerCase()} sessions`}
            </p>
            <button
              onClick={() => navigate('/peer-supporters')}
              className="mt-5 px-5 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm rounded-xl font-medium transition-colors"
            >
              Find a Peer Counselor
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((session) => {
              const peer = session.peerId;
              const peerInitial = peer?.name?.[0]?.toUpperCase() || '?';
              return (
                <div
                  key={session._id}
                  className={`bg-white rounded-2xl shadow-sm border border-gray-100 border-l-4 ${STATUS_BORDER[session.status] || 'border-l-gray-300'} overflow-hidden`}
                >
                  {/* Top row: counselor info + actions */}
                  <div className="flex items-center justify-between px-6 pt-5 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        {peer?.avatar?.url ? (
                          <img
                            src={peer.avatar.url}
                            alt={peer.name}
                            className="w-12 h-12 rounded-full object-cover border-2 border-gray-100"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-lg border-2 border-gray-100">
                            {peerInitial}
                          </div>
                        )}
                        <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white bg-gray-300" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-base">{peer?.name || 'Peer Counselor'}</p>
                        <p className="text-xs text-gray-400 mt-0.5">Peer Counselor</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-semibold px-3 py-1.5 rounded-full capitalize ${STATUS_BADGE[session.status] || 'bg-gray-100 text-gray-600'}`}
                      >
                        {session.status}
                      </span>
                      {session.status !== 'cancelled' && session.status !== 'completed' && (
                        <button
                          onClick={() => handleCancel(session._id)}
                          className="text-xs text-red-500 hover:text-red-700 font-medium px-2 py-1 rounded-lg hover:bg-red-50 transition-colors"
                        >
                          Cancel
                        </button>
                      )}
                      <button
                        onClick={() => navigate(`/chat/${peer?._id}`)}
                        className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                      >
                        <FiMessageCircle className="w-3.5 h-3.5" />
                        Chat
                      </button>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-gray-50 mx-6" />

                  {/* Bottom row: date / time / topic */}
                  <div className="grid grid-cols-3 divide-x divide-gray-100 px-6 py-4">
                    <div className="pr-6">
                      <div className="flex items-center gap-2 text-gray-400 mb-1">
                        <FiCalendar className="w-3.5 h-3.5" />
                        <span className="text-xs font-semibold uppercase tracking-wider">Date</span>
                      </div>
                      <p className="text-sm font-medium text-gray-800">{fmtDate(session.date)}</p>
                    </div>
                    <div className="px-6">
                      <div className="flex items-center gap-2 text-gray-400 mb-1">
                        <FiClock className="w-3.5 h-3.5" />
                        <span className="text-xs font-semibold uppercase tracking-wider">Time</span>
                      </div>
                      <p className="text-sm font-medium text-gray-800">{session.time}</p>
                    </div>
                    <div className="pl-6">
                      <div className="flex items-center gap-2 text-gray-400 mb-1">
                        <FiMessageSquare className="w-3.5 h-3.5" />
                        <span className="text-xs font-semibold uppercase tracking-wider">Topic</span>
                      </div>
                      <p className="text-sm font-medium text-gray-800 line-clamp-1">{session.topic}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MySessionsPage;
