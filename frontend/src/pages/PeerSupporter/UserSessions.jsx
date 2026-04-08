import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import * as sessionApi from '../../api/session.api';
import toast from 'react-hot-toast';
import { FiArrowLeft, FiCalendar, FiClock, FiMessageSquare, FiTrash2, FiCheckCircle } from 'react-icons/fi';

const UserSessions = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, confirmed, completed, cancelled

  // Fetch user's sessions
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        setLoading(true);
        const res = await sessionApi.getUserSessions();
        if (res.success) {
          setSessions(res.data || []);
        } else {
          toast.error('Failed to load sessions');
        }
      } catch (error) {
        console.error('Error fetching sessions:', error);
        toast.error('Failed to load sessions');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchSessions();
    }
  }, [user]);

  // Filter sessions
  const filteredSessions = sessions.filter((session) => {
    if (filter === 'all') return true;
    return session.status === filter;
  });

  // Cancel session
  const handleCancelSession = async (sessionId) => {
    if (!window.confirm('Are you sure you want to cancel this session?')) return;

    try {
      const res = await sessionApi.cancelSession(sessionId);
      if (res.success) {
        setSessions(sessions.map((s) => (s._id === sessionId ? { ...s, status: 'cancelled' } : s)));
        toast.success('Session cancelled successfully');
      } else {
        toast.error('Failed to cancel session');
      }
    } catch (error) {
      console.error('Error cancelling session:', error);
      toast.error('Failed to cancel session');
    }
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-50 border-yellow-200 text-yellow-700';
      case 'confirmed':
        return 'bg-green-50 border-green-200 text-green-700';
      case 'completed':
        return 'bg-blue-50 border-blue-200 text-blue-700';
      case 'cancelled':
        return 'bg-red-50 border-red-200 text-red-700';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-700';
    }
  };

  const getStatusLabel = (status) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  if (loading) {
    return (
      <div className="container-custom py-8 flex justify-center">
        <div className="animate-pulse text-gray-400">Loading sessions...</div>
      </div>
    );
  }

  return (
    <div className="container-custom py-8">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium mb-8 transition-colors"
      >
        <FiArrowLeft className="w-5 h-5" />
        Go Back
      </button>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">My Sessions</h1>
        <p className="text-gray-600">View and manage your booked peer counseling sessions</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-8 border-b border-gray-200">
        {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-4 py-3 font-medium border-b-2 transition-colors ${
              filter === tab
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            {getStatusLabel(tab)}
            <span className="ml-2 text-sm">
              ({filteredSessions.length})
            </span>
          </button>
        ))}
      </div>

      {/* Sessions List */}
      {filteredSessions.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <FiCalendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No sessions yet</h3>
          <p className="text-gray-600">You haven't booked any sessions. Browse peer counselors to get started!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredSessions.map((session) => (
            <div
              key={session._id}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-6"
            >
              <div className="flex items-start justify-between gap-4">
                {/* Session Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-lg font-bold text-gray-900">
                      {session.supporterId?.name || 'Unknown Counselor'}
                    </h3>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(
                        session.status
                      )}`}
                    >
                      {getStatusLabel(session.status)}
                    </span>
                  </div>

                  {/* Session details */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                    {/* Date */}
                    <div className="flex items-center gap-2 text-gray-600">
                      <FiCalendar className="w-4 h-4 flex-shrink-0" />
                      <span className="text-sm">
                        {new Date(session.sessionDate).toLocaleDateString('en-US', {
                          weekday: 'short',
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>

                    {/* Time */}
                    <div className="flex items-center gap-2 text-gray-600">
                      <FiClock className="w-4 h-4 flex-shrink-0" />
                      <span className="text-sm">{session.sessionTime}</span>
                    </div>

                    {/* Topic */}
                    <div className="flex items-center gap-2 text-gray-600">
                      <FiMessageSquare className="w-4 h-4 flex-shrink-0" />
                      <span className="text-sm font-medium truncate">{session.topic}</span>
                    </div>
                  </div>

                  {/* Notes */}
                  {session.notes && (
                    <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                      <strong>Notes:</strong> {session.notes}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 flex-shrink-0">
                  {(session.status === 'pending' || session.status === 'confirmed') && (
                    <button
                      onClick={() => handleCancelSession(session._id)}
                      className="p-2 rounded-lg hover:bg-red-50 text-red-600 hover:text-red-700 transition-colors"
                      title="Cancel session"
                    >
                      <FiTrash2 className="w-5 h-5" />
                    </button>
                  )}
                  {session.status === 'confirmed' && (
                    <div className="p-2 rounded-lg bg-green-50 text-green-600">
                      <FiCheckCircle className="w-5 h-5" />
                    </div>
                  )}
                </div>
              </div>

              {/* Meeting Link (if available) */}
              {session.meetingLink && session.status === 'confirmed' && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <a
                    href={session.meetingLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
                  >
                    Join Meeting
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserSessions;
