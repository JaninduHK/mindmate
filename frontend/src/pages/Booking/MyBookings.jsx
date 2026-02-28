import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiCalendar, FiUser } from 'react-icons/fi';
import { format } from 'date-fns';
import { bookingAPI } from '../../api/booking.api';
import Loading from '../../components/common/Loading';
import toast from 'react-hot-toast';

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  completed: 'bg-blue-100 text-blue-800',
  refunded: 'bg-gray-100 text-gray-600',
};

const MyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchBookings = async () => {
    try {
      const res = await bookingAPI.getMy();
      if (res.success) setBookings(res.data.bookings);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchBookings(); }, []);

  const handleCancel = async (id) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;
    try {
      await bookingAPI.cancel(id, { reason: 'Cancelled by user' });
      toast.success('Booking cancelled');
      fetchBookings();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not cancel booking');
    }
  };

  if (loading) return <div className="flex justify-center py-16"><Loading /></div>;

  return (
    <div className="container-custom py-8 max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Bookings</h1>

      {bookings.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p>No bookings yet.</p>
          <Link to="/events" className="mt-2 inline-block text-primary-600 hover:underline text-sm">Browse events</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((b) => (
            <div key={b._id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <Link to={`/events/${b.eventId?._id}`} className="font-semibold text-gray-900 hover:text-primary-600">
                    {b.eventId?.title}
                  </Link>
                  {b.eventId?.startDate && (
                    <div className="flex items-center space-x-1 text-sm text-gray-500">
                      <FiCalendar className="w-3.5 h-3.5" />
                      <span>{format(new Date(b.eventId.startDate), 'MMM d, yyyy · h:mm a')}</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-1 text-sm text-gray-500">
                    <FiUser className="w-3.5 h-3.5" />
                    <span>{b.counselorId?.name}</span>
                  </div>
                </div>
                <div className="text-right space-y-2">
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${STATUS_COLORS[b.status] || 'bg-gray-100'}`}>
                    {b.status}
                  </span>
                  <p className="text-sm font-semibold text-gray-900">${b.amountPaid?.toFixed(2)}</p>
                </div>
              </div>

              {['pending', 'confirmed'].includes(b.status) && (
                <button
                  onClick={() => handleCancel(b._id)}
                  className="mt-3 text-sm text-red-500 hover:underline"
                >
                  Cancel booking
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyBookings;
