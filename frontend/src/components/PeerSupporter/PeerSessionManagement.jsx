import { useState, useEffect, useCallback } from 'react';
import { FiClock, FiCheckCircle, FiXCircle, FiAlertCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { getSupporterBookings, acceptSession, cancelSession } from '../../api/session.api';
import { useNotification } from '../../hooks/useNotification';

const PeerSessionManagement = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending'); // pending, confirmed, all
  const [actionLoading, setActionLoading] = useState(null);
  const { messageNotifications } = useNotification();

  useEffect(() => {
    fetchBookings();
  }, []);

  // Refresh bookings when a new session is booked (received via socket)
  useEffect(() => {
    const recentSessionBooked = messageNotifications.find(
      (notif) => notif.type === 'session_booked'
    );
    
    if (recentSessionBooked) {
      // Refresh the bookings list
      fetchBookings();
    }
  }, [messageNotifications]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await getSupporterBookings();
      if (response.success) {
        setBookings(response.data);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (sessionId) => {
    try {
      setActionLoading(sessionId);
      const response = await acceptSession(sessionId);
      if (response.success) {
        toast.success('Session accepted!');
        setBookings((prev) =>
          prev.map((booking) =>
            booking._id === sessionId ? { ...booking, status: 'confirmed' } : booking
          )
        );
      }
    } catch (error) {
      console.error('Error accepting session:', error);
      toast.error(error.response?.data?.message || 'Failed to accept session');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async (sessionId) => {
    const reason = window.prompt('Please provide a reason for cancellation:');
    if (reason === null) return; // User cancelled the prompt

    try {
      setActionLoading(sessionId);
      const response = await cancelSession(sessionId, reason);
      if (response.success) {
        toast.success('Session cancelled');
        setBookings((prev) =>
          prev.map((booking) =>
            booking._id === sessionId ? { ...booking, status: 'cancelled' } : booking
          )
        );
      }
    } catch (error) {
      console.error('Error cancelling session:', error);
      toast.error(error.response?.data?.message || 'Failed to cancel session');
    } finally {
      setActionLoading(null);
    }
  };

  const filteredBookings =
    filter === 'pending'
      ? bookings.filter((b) => b.status === 'pending')
      : filter === 'confirmed'
      ? bookings.filter((b) => b.status === 'confirmed')
      : bookings;

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-50 border-yellow-200 text-yellow-900';
      case 'confirmed':
        return 'bg-green-50 border-green-200 text-green-900';
      case 'cancelled':
        return 'bg-red-50 border-red-200 text-red-900';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-900';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <FiAlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'confirmed':
        return <FiCheckCircle className="w-5 h-5 text-green-500" />;
      case 'cancelled':
        return <FiXCircle className="w-5 h-5 text-red-500" />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading sessions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-primary-50 border border-primary-100 flex items-center justify-center text-primary-600">
          <FiClock className="w-5 h-5" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Session Bookings</h2>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        {['pending', 'confirmed', 'all'].map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              filter === tab
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab === 'all' ? 'All' : tab === 'pending' ? 'Pending' : 'Confirmed'}
            {filter === tab && (
              <span className="ml-2 inline-block w-5 h-5 bg-primary-600 text-white text-xs rounded-full flex items-center justify-center font-bold">
                {filteredBookings.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Bookings List */}
      <div className="space-y-4">
        {filteredBookings.length === 0 ? (
          <div className="text-center py-8">
            <FiClock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">
              {filter === 'pending' ? 'No pending sessions' : 'No sessions yet'}
            </p>
          </div>
        ) : (
          filteredBookings.map((booking) => (
            <div
              key={booking._id}
              className={`border-2 rounded-xl p-5 transition-all ${getStatusColor(booking.status)}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {getStatusIcon(booking.status)}
                    <h3 className="font-bold text-lg capitalize">{booking.status}</h3>
                  </div>

                  <div className="space-y-2 text-sm">
                    <p>
                      <span className="font-semibold">User:</span>{' '}
                      {booking.userId?.name || 'Unknown'}
                    </p>
                    <p>
                      <span className="font-semibold">Topic:</span> {booking.topic}
                    </p>
                    <p>
                      <span className="font-semibold">Date & Time:</span>{' '}
                      {new Date(booking.sessionDate).toLocaleDateString()} at{' '}
                      {booking.sessionTime}
                    </p>
                    {booking.notes && (
                      <p>
                        <span className="font-semibold">Notes:</span> {booking.notes}
                      </p>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                {booking.status === 'pending' && (
                  <div className="flex flex-col gap-2 shrink-0">
                    <button
                      onClick={() => handleAccept(booking._id)}
                      disabled={actionLoading === booking._id}
                      className="bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      {actionLoading === booking._id ? 'Accepting...' : 'Accept'}
                    </button>
                    <button
                      onClick={() => handleCancel(booking._id)}
                      disabled={actionLoading === booking._id}
                      className="bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      {actionLoading === booking._id ? 'Cancelling...' : 'Decline'}
                    </button>
                  </div>
                )}

                {booking.status === 'confirmed' && (
                  <div className="flex flex-col gap-2 shrink-0">
                    <button
                      onClick={() => handleCancel(booking._id)}
                      disabled={actionLoading === booking._id}
                      className="bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      {actionLoading === booking._id ? 'Cancelling...' : 'Cancel'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default PeerSessionManagement;
