import { useState, useEffect } from 'react';
import { adminAPI } from '../../api/admin.api';
import Loading from '../../components/common/Loading';
import { format } from 'date-fns';

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  completed: 'bg-blue-100 text-blue-800',
  refunded: 'bg-gray-100 text-gray-600',
};

const AdminBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAPI.listBookings({ limit: 50 }).then((res) => {
      if (res.success) setBookings(res.data.bookings);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  return (
    <div className="container-custom py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">All Bookings</h1>
      {loading ? <Loading /> : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="px-4 py-3 text-left">Event</th>
                <th className="px-4 py-3 text-left">User</th>
                <th className="px-4 py-3 text-left">Counselor</th>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left">Amount</th>
                <th className="px-4 py-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {bookings.map((b) => (
                <tr key={b._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{b.eventId?.title}</td>
                  <td className="px-4 py-3 text-gray-500">{b.userId?.name}</td>
                  <td className="px-4 py-3 text-gray-500">{b.counselorId?.name}</td>
                  <td className="px-4 py-3 text-gray-500">{format(new Date(b.createdAt), 'MMM d, yyyy')}</td>
                  <td className="px-4 py-3 font-medium">${b.amountPaid?.toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[b.status] || 'bg-gray-100'}`}>
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

export default AdminBookings;
