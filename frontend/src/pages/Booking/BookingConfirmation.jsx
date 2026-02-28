import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FiCheckCircle, FiCalendar, FiUser } from 'react-icons/fi';
import { bookingAPI } from '../../api/booking.api';
import Loading from '../../components/common/Loading';
import { format } from 'date-fns';

const BookingConfirmation = () => {
  const { bookingId } = useParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await bookingAPI.getById(bookingId);
        if (res.success) setBooking(res.data.booking);
      } catch {}
      setLoading(false);
    };
    fetch();
  }, [bookingId]);

  if (loading) return <div className="flex justify-center py-16"><Loading /></div>;

  return (
    <div className="container-custom py-16 max-w-lg text-center">
      <FiCheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Booking Confirmed!</h1>
      <p className="text-gray-500 mb-6">Your booking has been placed. Check your email for details.</p>

      {booking && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-left space-y-3 mb-6">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <FiCalendar className="w-4 h-4 text-gray-400" />
            <span>{booking.eventId?.title}</span>
          </div>
          {booking.eventId?.startDate && (
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <FiCalendar className="w-4 h-4 text-gray-400" />
              <span>{format(new Date(booking.eventId.startDate), 'EEEE, MMM d, yyyy · h:mm a')}</span>
            </div>
          )}
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <FiUser className="w-4 h-4 text-gray-400" />
            <span>{booking.counselorId?.name}</span>
          </div>
          <div className="flex justify-between text-sm font-semibold pt-2 border-t border-gray-100">
            <span>Amount Paid</span>
            <span className="text-primary-600">${booking.amountPaid?.toFixed(2)}</span>
          </div>
        </div>
      )}

      <div className="flex gap-3 justify-center">
        <Link
          to="/booking/my"
          className="bg-primary-600 hover:bg-primary-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
        >
          My Bookings
        </Link>
        <Link
          to="/events"
          className="border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold px-6 py-3 rounded-xl transition-colors"
        >
          Browse More
        </Link>
      </div>
    </div>
  );
};

export default BookingConfirmation;
