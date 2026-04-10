import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { bookingAPI } from '../../api/booking.api';
import Loading from '../../components/common/Loading';

const STATUS_STYLES = {
  confirmed: 'bg-green-100 text-green-700',
  pending:   'bg-yellow-100 text-yellow-800',
  cancelled: 'bg-red-100 text-red-700',
  completed: 'bg-blue-100 text-blue-700',
  refunded:  'bg-gray-100 text-gray-600',
};

const STATUSES = ['all', 'pending', 'confirmed', 'completed', 'cancelled', 'refunded'];

const CounselorBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('all');

  useEffect(() => {
    setLoading(true);
    const params = { limit: 50 };
    if (status !== 'all') params.status = status;
    bookingAPI.getCounselorBookings(params)
      .then((res) => {
        if (res.success) {
          setBookings(res.data.bookings);
          setTotal(res.data.total);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [status]);

  return (
    <div className="container-custom py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bookings</h1>
          {!loading && <p className="text-sm text-gray-500 mt-0.5">{total} total booking{total !== 1 ? 's' : ''}</p>}
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s === 'all' ? 'All Statuses' : s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loading /></div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-16 text-gray-400">No bookings found</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Student</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Event</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Date</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Amount</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Payment</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {bookings.map((b) => (
                <tr key={b._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4">
                    <p className="font-medium text-gray-900">{b.attendee?.name || b.userId?.name || '—'}</p>
                    <p className="text-xs text-gray-400">{b.attendee?.email || b.userId?.email}</p>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-gray-800">{b.eventId?.title || '—'}</p>
                    {b.eventId?.startDate && (
                      <p className="text-xs text-gray-400">{format(new Date(b.eventId.startDate), 'MMM d, yyyy · h:mm a')}</p>
                    )}
                  </td>
                  <td className="px-5 py-4 text-gray-600">
                    {format(new Date(b.createdAt), 'MMM d, yyyy')}
                  </td>
                  <td className="px-5 py-4 font-medium text-gray-900">
                    LKR {b.amountPaid?.toFixed(2) ?? '—'}
                  </td>
                  <td className="px-5 py-4 text-gray-600 capitalize">
                    {b.paymentMethod?.replace('_', ' ')}
                  </td>
                  <td className="px-5 py-4">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${STATUS_STYLES[b.status] ?? 'bg-gray-100 text-gray-600'}`}>
                      {b.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default CounselorBookings;
