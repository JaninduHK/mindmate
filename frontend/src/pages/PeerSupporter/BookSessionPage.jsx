import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { peerSupporterAPI } from '../../api/peerSupporter.api';
import { useAuth } from '../../hooks/useAuth';
import { FiArrowLeft, FiCalendar, FiClock, FiMessageSquare } from 'react-icons/fi';
import toast from 'react-hot-toast';

const BookSessionPage = () => {
  const { supporterId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [supporter, setSupporter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionDate, setSessionDate] = useState('');
  const [sessionTime, setSessionTime] = useState('09:00');
  const [topic, setTopic] = useState('');
  const [notes, setNotes] = useState('');
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    const fetchSupporter = async () => {
      try {
        const res = await peerSupporterAPI.getById(supporterId);
        if (res.success) {
          setSupporter(res.data);
        } else {
          toast.error('Peer counselor not found');
          navigate('/peer-supporters');
        }
      } catch (error) {
        console.error('Error fetching supporter:', error);
        toast.error('Failed to load peer counselor details');
        navigate('/peer-supporters');
      } finally {
        setLoading(false);
      }
    };
    fetchSupporter();
  }, [supporterId, navigate]);

  const handleBooking = async (e) => {
    e.preventDefault();

    if (!sessionDate) {
      toast.error('Please select a session date');
      return;
    }

    if (!sessionTime) {
      toast.error('Please select a session time');
      return;
    }

    if (!topic.trim()) {
      toast.error('Please enter a topic');
      return;
    }

    setBooking(true);
    try {
      // Assuming there's a booking API endpoint
      const res = await peerSupporterAPI.bookSession({
        supporterId,
        sessionDate,
        sessionTime,
        topic,
        notes,
      });

      if (res.success) {
        toast.success('Session booked successfully!');
        navigate('/peer-supporters');
      } else {
        toast.error(res.message || 'Failed to book session');
      }
    } catch (error) {
      console.error('Error booking session:', error);
      toast.error(error.response?.data?.message || 'Failed to book session');
    } finally {
      setBooking(false);
    }
  };

  if (loading) {
    return (
      <div className="container-custom py-8 flex justify-center">
        <div className="animate-pulse text-gray-400">Loading...</div>
      </div>
    );
  }

  if (!supporter) {
    return null;
  }

  // Get minimum date (today)
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="container-custom py-8">
      {/* Back Button */}
      <button
        onClick={() => navigate('/peer-supporters')}
        className="flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium mb-8 transition-colors"
      >
        <FiArrowLeft className="w-5 h-5" />
        Back to Peer Counselors
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Supporter Info */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sticky top-24">
            <div className="flex flex-col items-center text-center">
              {supporter.avatar?.url ? (
                <img
                  src={supporter.avatar.url}
                  alt={supporter.name}
                  className="w-24 h-24 rounded-full object-cover border-4 border-primary-50 mb-4"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-primary-100 flex items-center justify-center text-3xl font-bold text-primary-600 mb-4">
                  {supporter.name?.[0]}
                </div>
              )}

              <h2 className="text-2xl font-bold text-gray-900">{supporter.name}</h2>
              <p className="text-gray-600 text-sm mt-1">{supporter.email}</p>

              <div className="mt-4 inline-block bg-primary-50 text-primary-700 px-3 py-1.5 rounded-full text-xs font-semibold">
                Peer Counselor
              </div>

              {supporter.bio && (
                <p className="text-gray-600 text-sm mt-4 leading-relaxed">
                  {supporter.bio}
                </p>
              )}

              <div className="w-full mt-6 pt-6 border-t border-gray-100">
                <p className="text-xs text-gray-500 font-semibold mb-3">SPECIALIZATIONS</p>
                <div className="flex flex-wrap gap-2">
                  {supporter.specializations?.map((spec, idx) => (
                    <span
                      key={idx}
                      className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-medium"
                    >
                      {spec}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Booking Form */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Book a Session</h1>

            <form onSubmit={handleBooking} className="space-y-6">
              {/* Session Date */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  <FiCalendar className="inline-block w-4 h-4 mr-2" />
                  Session Date *
                </label>
                <input
                  type="date"
                  value={sessionDate}
                  onChange={(e) => setSessionDate(e.target.value)}
                  min={today}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              {/* Session Time */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  <FiClock className="inline-block w-4 h-4 mr-2" />
                  Session Time *
                </label>
                <input
                  type="time"
                  value={sessionTime}
                  onChange={(e) => setSessionTime(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              {/* Topic */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  <FiMessageSquare className="inline-block w-4 h-4 mr-2" />
                  Topic for Discussion *
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g., Stress management, Career guidance"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              {/* Additional Notes */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Additional Notes (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any additional information about your session..."
                  rows="4"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                />
              </div>

              {/* Submit Button */}
              <div className="flex gap-3 pt-6">
                <button
                  type="button"
                  onClick={() => navigate('/peer-supporters')}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={booking}
                  className="flex-1 px-6 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {booking ? 'Booking...' : 'Confirm Booking'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookSessionPage;
