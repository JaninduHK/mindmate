import { useState, useEffect } from 'react';
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

const RequestForm = ({ available, onSuccess }) => {
  const [form, setForm] = useState({
    amount: '',
    accountName: '',
    accountNumber: '',
    bankName: '',
    swiftCode: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const amount = parseFloat(form.amount);
    if (!amount || amount <= 0) { toast.error('Enter a valid amount'); return; }
    if (amount > available) { toast.error(`Maximum available: Rs. ${available.toFixed(2)}`); return; }
    if (!form.accountName || !form.accountNumber || !form.bankName) {
      toast.error('Account name, number, and bank name are required');
      return;
    }

    setSubmitting(true);
    try {
      const res = await withdrawalAPI.create({
        amount,
        bankDetails: {
          accountName: form.accountName,
          accountNumber: form.accountNumber,
          bankName: form.bankName,
          swiftCode: form.swiftCode,
        },
      });
      if (!res.success) throw new Error(res.message);
      toast.success('Withdrawal request submitted');
      setForm({ amount: '', accountName: '', accountNumber: '', bankName: '', swiftCode: '' });
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
      <h2 className="font-semibold text-gray-900 text-lg">New Withdrawal Request</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Amount (LKR) <span className="text-gray-400 font-normal">— max Rs. {available.toFixed(2)}</span>
          </label>
          <input
            type="number"
            name="amount"
            min="1"
            step="0.01"
            max={available}
            value={form.amount}
            onChange={handleChange}
            placeholder="0.00"
            required
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Account Holder Name</label>
          <input
            type="text"
            name="accountName"
            value={form.accountName}
            onChange={handleChange}
            placeholder="Full name on account"
            required
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
          <input
            type="text"
            name="accountNumber"
            value={form.accountNumber}
            onChange={handleChange}
            placeholder="Bank account number"
            required
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
          <input
            type="text"
            name="bankName"
            value={form.bankName}
            onChange={handleChange}
            placeholder="e.g. Chase, Barclays"
            required
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            SWIFT / BIC Code <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <input
            type="text"
            name="swiftCode"
            value={form.swiftCode}
            onChange={handleChange}
            placeholder="e.g. CHASUS33"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      <p className="text-xs text-gray-500">
        Withdrawals are processed manually by the admin team. You will be notified once the transfer is completed.
      </p>

      <button
        type="submit"
        disabled={submitting || available <= 0}
        className="bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors"
      >
        {submitting ? 'Submitting…' : 'Request Withdrawal'}
      </button>
    </form>
  );
};

const CounselorWithdrawals = () => {
  const [balance, setBalance] = useState(null);
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const [bRes, wRes] = await Promise.all([
        withdrawalAPI.getBalance(),
        withdrawalAPI.getMyWithdrawals({ limit: 20 }),
      ]);
      if (bRes.success) setBalance(bRes.data.balance);
      if (wRes.success) setWithdrawals(wRes.data.withdrawals);
    } catch {
      toast.error('Failed to load withdrawal data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) return <div className="flex justify-center py-16"><Loading /></div>;

  return (
    <div className="container-custom py-8 max-w-3xl space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">Withdrawals</h1>

      {/* Balance summary */}
      {balance && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total Earned', value: `Rs. ${balance.totalEarned.toFixed(2)}`, color: 'text-gray-900' },
            { label: 'Withdrawn', value: `Rs. ${balance.withdrawn.toFixed(2)}`, color: 'text-gray-500' },
            { label: 'Pending / Processing', value: `Rs. ${balance.locked.toFixed(2)}`, color: 'text-yellow-600' },
            { label: 'Available', value: `Rs. ${balance.available.toFixed(2)}`, color: 'text-green-600 font-bold' },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <p className="text-xs text-gray-500 mb-1">{s.label}</p>
              <p className={`text-xl font-semibold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Request form */}
      <RequestForm available={balance?.available ?? 0} onSuccess={load} />

      {/* History */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h2 className="font-semibold text-gray-900 text-lg mb-4">Withdrawal History</h2>

        {withdrawals.length === 0 ? (
          <p className="text-sm text-gray-500">No withdrawal requests yet.</p>
        ) : (
          <div className="space-y-3">
            {withdrawals.map((w) => (
              <div key={w._id} className="flex items-start justify-between border border-gray-100 rounded-xl p-4">
                <div className="space-y-1">
                  <p className="font-semibold text-gray-900">Rs. {w.amount.toFixed(2)}</p>
                  <p className="text-xs text-gray-500">
                    {w.bankDetails.bankName} · {w.bankDetails.accountNumber}
                  </p>
                  <p className="text-xs text-gray-400">
                    {format(new Date(w.createdAt), 'MMM d, yyyy')}
                  </p>
                  {w.adminNote && (
                    <p className="text-xs text-gray-600 mt-1 italic">Note: {w.adminNote}</p>
                  )}
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_STYLES[w.status]}`}>
                  {w.status.charAt(0).toUpperCase() + w.status.slice(1)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CounselorWithdrawals;
