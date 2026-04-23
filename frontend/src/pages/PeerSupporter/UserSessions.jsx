import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import * as sessionApi from '../../api/session.api';
import toast from 'react-hot-toast';
import { FiArrowLeft, FiCalendar, FiClock, FiMessageSquare, FiTrash2, FiCheckCircle, FiSend } from 'react-icons/fi';
import { socket } from '../../socket/socket';

const UserSessions = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, confirmed, completed, cancelled

  // Helper: Calculate duration in minutes from startTime and endTime
  const calculateSessionDuration = (startTime, endTime) => {
    if (!startTime || !endTime) return 60; // Default 60 minutes
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    const startMins = startH * 60 + startM;
    const endMins = endH * 60 + endM;
    return Math.max(endMins - startMins, 60); // At least 60 minutes
  };

  // Check if chat is allowed for a session
  const isChatAllowed = (session) => {
    // Never allow chat for cancelled sessions
    if (session.status === 'cancelled') {
      return false;
    }

    // Allow chat for completed/past sessions (review mode)
    if (session.status === 'completed') {
      return true;
    }

    // Only allow chat during the actual session time window
    const sessionDate = new Date(session.sessionDate);
    const now = new Date();
    const sessionDateStr = sessionDate.toISOString().split('T')[0];
    const todayStr = now.toISOString().split('T')[0];

    // Session must be today
    if (sessionDateStr !== todayStr) {
      return false;
    }

    // Use startTime if available, fallback to sessionTime
    const startTimeStr = session.startTime || session.sessionTime;
    const endTimeStr = session.endTime;
    
    if (!startTimeStr) return false;

    // Parse start time
    const [startHour, startMinute] = startTimeStr.split(':').map(Number);
    const startTotalMinutes = startHour * 60 + startMinute;
    
    // Parse end time or calculate from duration
    let endTotalMinutes;
    if (endTimeStr) {
      const [endHour, endMinute] = endTimeStr.split(':').map(Number);
      endTotalMinutes = endHour * 60 + endMinute;
    } else {
      // Fallback: add 90 minutes to start (old behavior)
      endTotalMinutes = startTotalMinutes + 90;
    }

    const nowTotalMinutes = now.getHours() * 60 + now.getMinutes();

    // Allow 30 minutes before start time and 30 minutes after end time
    const startWindow = startTotalMinutes - 30;
    const endWindow = endTotalMinutes + 30;

    return nowTotalMinutes >= startWindow && nowTotalMinutes <= endWindow;
  };

  // Get chat button tooltip
  const getChatTooltip = (session) => {
    if (session.status === 'cancelled') {
      return 'Cannot chat - session cancelled';
    }
    if (session.status === 'completed') {
      return 'View past chat';
    }

    const sessionDate = new Date(session.sessionDate);
    const now = new Date();
    const sessionDateStr = sessionDate.toISOString().split('T')[0];
    const todayStr = now.toISOString().split('T')[0];

    const startTimeStr = session.startTime || session.sessionTime;
    const endTimeStr = session.endTime;
    const timeDisplay = endTimeStr ? `${startTimeStr} - ${endTimeStr}` : startTimeStr;

    if (sessionDateStr > todayStr) {
      return `Chat opens on ${sessionDateStr} at ${timeDisplay}`;
    }

    if (sessionDateStr < todayStr) {
      return 'Session date has passed';
    }

    // Session is today
    const [startHour, startMinute] = startTimeStr.split(':').map(Number);
    const startTotalMinutes = startHour * 60 + startMinute;
    
    let endTotalMinutes;
    if (endTimeStr) {
      const [endHour, endMinute] = endTimeStr.split(':').map(Number);
      endTotalMinutes = endHour * 60 + endMinute;
    } else {
      endTotalMinutes = startTotalMinutes + 90;
    }

    const nowTotalMinutes = now.getHours() * 60 + now.getMinutes();

    const startWindow = startTotalMinutes - 30;
    const endWindow = endTotalMinutes + 30;

    if (nowTotalMinutes < startWindow) {
      const minutesUntil = startWindow - nowTotalMinutes;
      const hoursUntil = Math.floor(minutesUntil / 60);
      const minsRemaining = minutesUntil % 60;
      return `Chat opens in ${hoursUntil}h ${minsRemaining}m`;
    }

    if (nowTotalMinutes > endWindow) {
      return 'Session has ended';
    }

    return 'Chat is active';
  };

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

  // Listen for real-time session status changes
  useEffect(() => {
    if (!socket || !user?._id) return;

    const handleSessionStatusChanged = (data) => {
      const { sessionId, newStatus } = data;
      console.log('📋 Session status changed:', data);

      // Update the session in the list
      setSessions((prev) =>
        prev.map((session) =>
          session._id === sessionId
            ? { ...session, status: newStatus }
            : session
        )
      );

      // Show notification
      if (newStatus === 'confirmed') {
        toast.success('Your session has been confirmed!');
      } else if (newStatus === 'cancelled') {
        toast.error('Your session has been cancelled.');
      }
    };

    socket.on('session_status_changed', handleSessionStatusChanged);
    console.log('✅ Session status change listener registered for user:', user._id);

    return () => {
      socket.off('session_status_changed', handleSessionStatusChanged);
      console.log('❌ Session status change listener unregistered');
    };
  }, [user?._id]);

  // Get count of sessions for a specific status
  const getSessionCount = (status) => {
    if (status === 'all') {
      return sessions.length;
    }
    return sessions.filter((session) => session.status === status).length;
  };

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
      <div className="flex gap-2 mb-8 border-b border-gray-200 overflow-x-auto">
        {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-4 py-3 font-medium border-b-2 transition-colors whitespace-nowrap ${
              filter === tab
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            {getStatusLabel(tab)}
            <span className="ml-2 text-sm">
              ({getSessionCount(tab)})
            </span>
          </button>
        ))}
      </div>

      {/* Sessions List */}
      {filteredSessions.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center flex flex-col items-center justify-center">
          <div className="w-20 h-20 bg-primary-50 rounded-full flex items-center justify-center mb-4">
            <FiCalendar className="w-10 h-10 text-primary-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No sessions found</h3>
          <p className="text-gray-500 max-w-md">
            You don't have any {filter !== 'all' ? filter : ''} sessions yet. 
            Browse peer counselors to book a new session!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {filteredSessions.map((session) => (
            <div
              key={session._id}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden group"
            >
              {/* Top Section with Status Banner */}
              <div className={`h-2 w-full ${
                session.status === 'pending' ? 'bg-yellow-400' :
                session.status === 'confirmed' ? 'bg-green-400' :
                session.status === 'completed' ? 'bg-blue-400' :
                'bg-red-400'
              }`} />
              
              <div className="p-6 md:p-8">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-6">
                  {/* Counselor Profile Info */}
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      {session.supporterId?.avatar?.url ? (
                        <img
                          src={session.supporterId.avatar.url}
                          alt={session.supporterId?.name}
                          className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-sm"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-full bg-primary-100 flex items-center justify-center text-xl font-bold text-primary-600 shadow-inner">
                          {session.supporterId?.name?.[0]?.toUpperCase() || 'C'}
                        </div>
                      )}
                      <span className={`absolute -bottom-1 -right-1 w-4 h-4 border-2 border-white rounded-full ${
                        session.status === 'confirmed' ? 'bg-green-500' : 'bg-gray-300'
                      }`}></span>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 tracking-tight group-hover:text-primary-600 transition-colors">
                        {session.supporterId?.name || 'Unknown Counselor'}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm text-gray-500">Peer Counselor</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions & Status Badge Menu */}
                  <div className="flex items-center gap-3 w-full md:w-auto">
                    <span
                      className={`px-4 py-1.5 rounded-full text-sm font-semibold border shadow-sm ${
                        session.status === 'pending' ? 'bg-yellow-50 border-yellow-200 text-yellow-700' :
                        session.status === 'confirmed' ? 'bg-green-50 border-green-200 text-green-700' :
                        session.status === 'completed' ? 'bg-blue-50 border-blue-200 text-blue-700' :
                        'bg-red-50 border-red-200 text-red-700'
                      }`}
                    >
                      {getStatusLabel(session.status)}
                    </span>
                    
                    {session.supporterId?._id && (
                      <button
                        onClick={() => navigate(`/chat/${session.supporterId._id}`)}
                        disabled={!isChatAllowed(session)}
                        className={`px-4 py-1.5 rounded-full flex items-center gap-2 transition-all font-medium border ${
                          isChatAllowed(session)
                            ? 'bg-white border-primary-200 text-primary-600 hover:bg-primary-50 hover:border-primary-300 shadow-sm cursor-pointer'
                            : 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed'
                        }`}
                        title={getChatTooltip(session)}
                      >
                        <FiSend className="w-4 h-4" />
                        <span>Chat</span>
                      </button>
                    )}
                    
                    {(session.status === 'pending' || session.status === 'confirmed') && (
                      <button
                        onClick={() => handleCancelSession(session._id)}
                        className="p-2 rounded-full hover:bg-red-50 text-red-600 border border-red-200 hover:border-red-300 shadow-sm transition-all"
                        title="Cancel session"
                      >
                        <FiTrash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>

                <hr className="border-gray-100 mb-6" />

                {/* Session details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  {/* Date */}
                  <div className="flex items-start gap-4 p-4 rounded-xl bg-gray-50/50 border border-gray-100 hover:bg-white hover:border-primary-100 hover:shadow-sm transition-all">
                    <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center flex-shrink-0">
                      <FiCalendar className="w-5 h-5 text-primary-600" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Date</p>
                      <p className="text-sm font-medium text-gray-900">
                        {new Date(session.sessionDate).toLocaleDateString('en-US', {
                          weekday: 'short',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>

                  {/* Time */}
                  <div className="flex items-start gap-4 p-4 rounded-xl bg-gray-50/50 border border-gray-100 hover:bg-white hover:border-primary-100 hover:shadow-sm transition-all">
                    <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center flex-shrink-0">
                      <FiClock className="w-5 h-5 text-primary-600" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Time</p>
                      <p className="text-sm font-medium text-gray-900">
                        {session.startTime && session.endTime
                          ? `${session.startTime} - ${session.endTime}`
                          : session.sessionTime || 'Not specified'}
                      </p>
                    </div>
                  </div>

                  {/* Topic */}
                  <div className="flex items-start gap-4 p-4 rounded-xl bg-gray-50/50 border border-gray-100 hover:bg-white hover:border-primary-100 hover:shadow-sm transition-all">
                    <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center flex-shrink-0">
                      <FiMessageSquare className="w-5 h-5 text-primary-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Topic</p>
                      <p className="text-sm font-medium text-gray-900 truncate" title={session.topic || 'General Support'}>
                        {session.topic || 'General Support'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {session.notes && (
                  <div className="mt-4 bg-[#f8fafc] rounded-xl p-5 border border-slate-100">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary-400"></div>
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">My Notes</span>
                    </div>
                    <p className="text-sm text-slate-700 leading-relaxed italic border-l-2 border-primary-200 pl-4 py-1">
                      "{session.notes}"
                    </p>
                  </div>
                )}
                
                {/* Meeting Link (if available) */}
                {session.meetingLink && session.status === 'confirmed' && (
                  <div className="mt-6 pt-6 border-t border-gray-100 flex justify-end">
                    <a
                      href={session.meetingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-full font-medium transition-colors shadow-sm flex items-center gap-2"
                    >
                      <span>Join Meeting</span>
                    </a>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserSessions;
