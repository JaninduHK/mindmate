import { useState, useEffect } from 'react';
import { adminAPI } from '../../api/admin.api';
import Loading from '../../components/common/Loading';
import toast from 'react-hot-toast';
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
  const [slipModal, setSlipModal] = useState(null); // { url, bookingId }
  const [processingId, setProcessingId] = useState(null);

  const fetchBookings = () => {
    adminAPI.listBookings({ limit: 50 }).then((res) => {
      if (res.success) setBookings(res.data.bookings);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { fetchBookings(); }, []);

  const handleConfirm = async (id) => {
    setProcessingId(id);
    try {
      await adminAPI.confirmBankTransfer(id);
      toast.success('Bank transfer confirmed');
      fetchBookings();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to confirm');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id) => {
    if (!confirm('Reject this bank transfer? The booking will be cancelled.')) return;
    setProcessingId(id);
    try {
      await adminAPI.rejectBankTransfer(id, { reason: 'Payment not verified' });
      toast.success('Bank transfer rejected');
      fetchBookings();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reject');
    } finally {
      setProcessingId(null);
    }
  };

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
                <th className="px-4 py-3 text-left">Method</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {bookings.map((b) => {
                const isBankPending = b.paymentMethod === 'bank_transfer' && b.status === 'pending';
                const busy = processingId === b._id;
                return (
                  <tr key={b._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{b.eventId?.title}</td>
                    <td className="px-4 py-3 text-gray-500">{b.userId?.name}</td>
                    <td className="px-4 py-3 text-gray-500">{b.counselorId?.name}</td>
                    <td className="px-4 py-3 text-gray-500">{format(new Date(b.createdAt), 'MMM d, yyyy')}</td>
                    <td className="px-4 py-3 font-medium">Rs. {b.amountPaid?.toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${b.paymentMethod === 'bank_transfer' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                        {b.paymentMethod === 'bank_transfer' ? 'Bank' : 'Stripe'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[b.status] || 'bg-gray-100'}`}>
                        {b.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {isBankPending ? (
                        <div className="flex items-center gap-2">
                          {b.bankSlip?.url && (
                            <button
                              onClick={() => setSlipModal({ url: b.bankSlip.url, bookingId: b._id })}
                              className="text-xs text-primary-600 hover:underline"
                            >
                              View slip
                            </button>
                          )}
                          <button
                            onClick={() => handleConfirm(b._id)}
                            disabled={busy}
                            className="text-xs bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white px-2 py-1 rounded-lg"
                          >
                            {busy ? '…' : 'Confirm'}
                          </button>
                          <button
                            onClick={() => handleReject(b._id)}
                            disabled={busy}
                            className="text-xs bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white px-2 py-1 rounded-lg"
                          >
                            {busy ? '…' : 'Reject'}
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Slip preview modal */}
      {slipModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setSlipModal(null)}>
          <div className="bg-white rounded-2xl p-4 max-w-lg w-full space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Payment Slip</h2>
              <button onClick={() => setSlipModal(null)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
            </div>
            <img src={slipModal.url} alt="Payment slip" className="w-full rounded-xl object-contain max-h-[60vh]" />
            <div className="flex gap-3">
              <button
                onClick={() => { handleConfirm(slipModal.bookingId); setSlipModal(null); }}
                disabled={!!processingId}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white font-semibold py-2 rounded-xl text-sm"
              >
                Confirm Transfer
              </button>
              <button
                onClick={() => { handleReject(slipModal.bookingId); setSlipModal(null); }}
                disabled={!!processingId}
                className="flex-1 bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white font-semibold py-2 rounded-xl text-sm"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBookings;
