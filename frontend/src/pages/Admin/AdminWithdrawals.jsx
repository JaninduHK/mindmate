import { useState, useEffect, useCallback } from 'react';
import { withdrawalAPI } from '../../api/withdrawal.api';
import Loading from '../../components/common/Loading';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const STATUS_STYLES = {
  pending: 'bg-yellow-100 text-yellow-800',
  processing: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
};

const ProcessModal = ({ withdrawal, onClose, onSave }) => {
  const [status, setStatus] = useState(withdrawal.status === 'pending' ? 'processing' : withdrawal.status);
  const [adminNote, setAdminNote] = useState(withdrawal.adminNote || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await withdrawalAPI.process(withdrawal._id, { status, adminNote });
      if (!res.success) throw new Error(res.message);
      toast.success('Withdrawal updated');
      onSave();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Process Withdrawal</h2>

        <div className="bg-gray-50 rounded-xl p-4 text-sm space-y-1">
          <p><span className="font-medium">Amount:</span> Rs. {withdrawal.amount.toFixed(2)}</p>
          <p><span className="font-medium">Counselor:</span> {withdrawal.counselorId?.name} ({withdrawal.counselorId?.email})</p>
          <p><span className="font-medium">Bank:</span> {withdrawal.bankDetails.bankName}</p>
          <p><span className="font-medium">Account:</span> {withdrawal.bankDetails.accountName} · {withdrawal.bankDetails.accountNumber}</p>
          {withdrawal.bankDetails.swiftCode && (
            <p><span className="font-medium">SWIFT:</span> {withdrawal.bankDetails.swiftCode}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="processing">Processing</option>
            <option value="completed">Completed</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Admin Note (optional)</label>
          <textarea
            value={adminNote}
            onChange={(e) => setAdminNote(e.target.value)}
            rows={3}
            placeholder="e.g. Transfer ref: TXN123456"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div className="flex justify-end space-x-3 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 rounded-xl transition-colors"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
};

const AdminWithdrawals = () => {
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [selected, setSelected] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { limit: 50 };
      if (statusFilter) params.status = statusFilter;
      const res = await withdrawalAPI.listAll(params);
      if (res.success) setWithdrawals(res.data.withdrawals);
    } catch {
      toast.error('Failed to load withdrawals');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  const handleSave = () => {
    setSelected(null);
    load();
  };

  return (
    <div className="container-custom py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Withdrawal Requests</h1>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="completed">Completed</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loading /></div>
      ) : withdrawals.length === 0 ? (
        <div className="text-center py-16 text-gray-500">No withdrawal requests found.</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Counselor', 'Amount', 'Bank', 'Submitted', 'Status', ''].map((h) => (
                  <th key={h} className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {withdrawals.map((w) => (
                <tr key={w._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{w.counselorId?.name}</p>
                    <p className="text-gray-400 text-xs">{w.counselorId?.email}</p>
                  </td>
                  <td className="px-4 py-3 font-semibold text-gray-900">
                    Rs. {w.amount.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    <p>{w.bankDetails.bankName}</p>
                    <p className="text-xs text-gray-400">{w.bankDetails.accountNumber}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {format(new Date(w.createdAt), 'MMM d, yyyy')}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_STYLES[w.status]}`}>
                      {w.status.charAt(0).toUpperCase() + w.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {w.status !== 'completed' && w.status !== 'rejected' && (
                      <button
                        onClick={() => setSelected(w)}
                        className="text-primary-600 hover:text-primary-700 font-medium text-xs"
                      >
                        Process
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <ProcessModal
          withdrawal={selected}
          onClose={() => setSelected(null)}
          onSave={handleSave}
        />
      )}
    </div>
  );
};

export default AdminWithdrawals;
