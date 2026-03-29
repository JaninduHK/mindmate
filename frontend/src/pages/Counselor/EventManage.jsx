import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiPlus, FiEdit2, FiEye } from 'react-icons/fi';
import { format } from 'date-fns';
import { eventAPI } from '../../api/event.api';
import Loading from '../../components/common/Loading';

const STATUS_COLORS = {
  draft: 'bg-gray-100 text-gray-600',
  published: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
  completed: 'bg-blue-100 text-blue-700',
};

const EventManage = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await eventAPI.getMyCounselorEvents({ limit: 50 });
        if (res.success) setEvents(res.data.events);
      } catch {}
      setLoading(false);
    };
    fetch();
  }, []);

  if (loading) return <div className="flex justify-center py-16"><Loading /></div>;

  return (
    <div className="container-custom py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Events</h1>
        <Link
          to="/counselor/events/create"
          className="flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
        >
          <FiPlus className="w-4 h-4" />
          <span>New Event</span>
        </Link>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p>No events yet.</p>
          <Link to="/counselor/events/create" className="mt-2 inline-block text-primary-600 hover:underline text-sm">
            Create your first event
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((e) => (
            <div key={e._id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">{e.title}</h3>
                <p className="text-sm text-gray-500 mt-0.5">
                  {format(new Date(e.startDate), 'MMM d, yyyy')} · {e.seatsAvailable}/{e.capacity} seats · LKR {e.price.toFixed(2)}
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${STATUS_COLORS[e.status] || 'bg-gray-100'}`}>
                  {e.status}
                </span>
                <Link to={`/events/${e._id}`} className="p-2 text-gray-400 hover:text-primary-600 transition-colors">
                  <FiEye className="w-4 h-4" />
                </Link>
                <Link to={`/counselor/events/${e._id}/edit`} className="p-2 text-gray-400 hover:text-primary-600 transition-colors">
                  <FiEdit2 className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EventManage;
