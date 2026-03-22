import { useState, useEffect } from 'react';
import { adminAPI } from '../../api/admin.api';
import Loading from '../../components/common/Loading';
import toast from 'react-hot-toast';

const AdminConfig = () => {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingCommission, setSavingCommission] = useState(false);
  const [savingBank, setSavingBank] = useState(false);

  const [commissionRate, setCommissionRate] = useState('');
  const [bankForm, setBankForm] = useState({
    bankName: '',
    accountName: '',
    accountNumber: '',
    branch: '',
    instructions: '',
  });

  useEffect(() => {
    adminAPI.getConfig().then((res) => {
      if (res.success) {
        setConfig(res.data.config);
        setCommissionRate(res.data.config.commissionRate?.toString() ?? '10');
        const bd = res.data.config.bankDetails ?? {};
        setBankForm({
          bankName: bd.bankName ?? '',
          accountName: bd.accountName ?? '',
          accountNumber: bd.accountNumber ?? '',
          branch: bd.branch ?? '',
          instructions: bd.instructions ?? '',
        });
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleSaveCommission = async (e) => {
    e.preventDefault();
    setSavingCommission(true);
    try {
      const res = await adminAPI.updateConfig({ commissionRate: parseFloat(commissionRate) });
      if (res.success) { setConfig(res.data.config); toast.success('Commission rate updated'); }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update');
    } finally {
      setSavingCommission(false);
    }
  };

  const handleSaveBank = async (e) => {
    e.preventDefault();
    setSavingBank(true);
    try {
      const res = await adminAPI.updateConfig({ bankDetails: bankForm });
      if (res.success) { setConfig(res.data.config); toast.success('Bank details updated'); }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update');
    } finally {
      setSavingBank(false);
    }
  };

  if (loading) return <div className="flex justify-center py-16"><Loading /></div>;

  return (
    <div className="container-custom py-8 max-w-2xl space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">Platform Settings</h1>

      {/* Commission rate */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Commission Rate</h2>
        <form onSubmit={handleSaveCommission} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Commission (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={commissionRate}
              onChange={(e) => setCommissionRate(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <p className="text-xs text-gray-400 mt-1">Percentage deducted from each booking as platform fee.</p>
          </div>
          <button type="submit" disabled={savingCommission}
            className="bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 text-white font-semibold px-5 py-2 rounded-xl text-sm transition-colors">
            {savingCommission ? 'Saving…' : 'Save'}
          </button>
        </form>
      </div>

      {/* Bank details */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="font-semibold text-gray-900 mb-1">Bank Transfer Details</h2>
        <p className="text-sm text-gray-500 mb-4">These details are shown to users who choose bank transfer at checkout.</p>
        <form onSubmit={handleSaveBank} className="space-y-4">
          {[
            { name: 'bankName', label: 'Bank Name', placeholder: 'e.g. Commercial Bank of Ceylon' },
            { name: 'accountName', label: 'Account Name', placeholder: 'e.g. MindMate (Pvt) Ltd' },
            { name: 'accountNumber', label: 'Account Number', placeholder: 'e.g. 0012345678' },
            { name: 'branch', label: 'Branch', placeholder: 'e.g. Colombo 03' },
          ].map(({ name, label, placeholder }) => (
            <div key={name}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
              <input
                type="text"
                value={bankForm[name]}
                onChange={(e) => setBankForm((prev) => ({ ...prev, [name]: e.target.value }))}
                placeholder={placeholder}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          ))}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Transfer Instructions <span className="text-gray-400">(optional)</span></label>
            <textarea
              value={bankForm.instructions}
              onChange={(e) => setBankForm((prev) => ({ ...prev, instructions: e.target.value }))}
              rows={2}
              placeholder="e.g. Use your booking ID as the reference number"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <button type="submit" disabled={savingBank}
            className="bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 text-white font-semibold px-5 py-2 rounded-xl text-sm transition-colors">
            {savingBank ? 'Saving…' : 'Save Bank Details'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminConfig;
