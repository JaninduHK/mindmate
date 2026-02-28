import { useState, useEffect } from 'react';
import { adminAPI } from '../../api/admin.api';
import Loading from '../../components/common/Loading';

const AdminEarnings = () => {
  const [data, setData] = useState(null);
  const [config, setConfig] = useState(null);
  const [rate, setRate] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([adminAPI.getEarnings(), adminAPI.getConfig()]).then(([eRes, cRes]) => {
      if (eRes.success) setData(eRes.data);
      if (cRes.success) {
        setConfig(cRes.data.config);
        setRate(cRes.data.config.commissionRate);
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleSaveRate = async () => {
    setSaving(true);
    try {
      const res = await adminAPI.updateConfig({ commissionRate: Number(rate) });
      if (res.success) setConfig(res.data.config);
    } catch {}
    setSaving(false);
  };

  if (loading) return <div className="flex justify-center py-16"><Loading /></div>;

  return (
    <div className="container-custom py-8 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Earnings & Commission</h1>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <p className="text-sm text-gray-500">Total Revenue</p>
          <p className="text-2xl font-bold text-gray-900">${data?.totalRevenue?.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <p className="text-sm text-gray-500">Platform Take</p>
          <p className="text-2xl font-bold text-primary-600">${data?.platformEarnings?.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <p className="text-sm text-gray-500">Counselor Payouts</p>
          <p className="text-2xl font-bold text-green-600">${data?.counselorEarnings?.toFixed(2)}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Commission Rate</h2>
        <div className="flex items-center space-x-3">
          <input
            type="number"
            min="0"
            max="100"
            step="0.5"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            className="w-32 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <span className="text-gray-500">%</span>
          <button
            onClick={handleSaveRate}
            disabled={saving}
            className="bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          Current rate: {config?.commissionRate}%. This applies to all new bookings.
        </p>
      </div>
    </div>
  );
};

export default AdminEarnings;
