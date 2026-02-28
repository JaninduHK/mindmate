import { useState, useEffect } from 'react';
import { adminAPI } from '../../api/admin.api';
import Loading from '../../components/common/Loading';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const STATUSES = ['draft', 'published', 'cancelled', 'completed'];

const AdminEvents = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.listEvents({ status: filter || undefined, limit: 50 });
      if (res.success) setEvents(res.data.events);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchEvents(); }, [filter]);

  const handleStatusChange = async (id, status) => {
    try {
      await adminAPI.updateEventStatus(id, { status });
      toast.success('Status updated');
      fetchEvents();
    } catch {
      toast.error('Failed to update');
    }
  };

  return (
    <div className="container-custom py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Events</h1>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      {loading ? <Loading /> : (
        <div className="space-y-3">
          {events.map((e) => (
            <div key={e._id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-900">{e.title}</p>
                <p className="text-sm text-gray-500 mt-0.5">
                  {e.counselorId?.name} · {format(new Date(e.startDate), 'MMM d, yyyy')} · ${e.price.toFixed(2)}
                </p>
              </div>
              <select
                value={e.status}
                onChange={(ev) => handleStatusChange(e._id, ev.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminEvents;
