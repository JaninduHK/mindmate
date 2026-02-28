import { useState, useEffect } from 'react';
import { adminAPI } from '../../api/admin.api';
import Loading from '../../components/common/Loading';
import toast from 'react-hot-toast';

const AdminCounselors = () => {
  const [counselors, setCounselors] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCounselors = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.listCounselors({ limit: 50 });
      if (res.success) setCounselors(res.data.counselors);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchCounselors(); }, []);

  const handleToggle = async (counselor) => {
    try {
      await adminAPI.toggleCounselorStatus(counselor.userId?._id, { isSuspended: !counselor.isSuspended });
      toast.success('Status updated');
      fetchCounselors();
    } catch {
      toast.error('Failed to update status');
    }
  };

  return (
    <div className="container-custom py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Counselors</h1>
      {loading ? <Loading /> : (
        <div className="space-y-3">
          {counselors.map((c) => (
            <div key={c._id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {c.userId?.avatar?.url ? (
                  <img src={c.userId.avatar.url} alt={c.userId.name} className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center font-bold text-primary-600">
                    {c.userId?.name?.[0]}
                  </div>
                )}
                <div>
                  <p className="font-semibold text-gray-900">{c.userId?.name}</p>
                  <p className="text-sm text-gray-500">{c.userId?.email}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{c.specializations?.join(', ')}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${c.isSuspended ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                  {c.isSuspended ? 'Suspended' : 'Active'}
                </span>
                <button
                  onClick={() => handleToggle(c)}
                  className="text-sm text-primary-600 hover:underline"
                >
                  {c.isSuspended ? 'Reinstate' : 'Suspend'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminCounselors;
