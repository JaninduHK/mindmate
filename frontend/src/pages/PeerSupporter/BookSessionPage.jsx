import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { peerSupporterAPI } from '../../api/peerSupporter.api';
import * as availabilityApi from '../../api/availability.api';
import * as sessionApi from '../../api/session.api';
import { useAuth } from '../../hooks/useAuth';
import { FiArrowLeft, FiCalendar, FiClock, FiMessageSquare } from 'react-icons/fi';
import { IoChevronBack, IoChevronForward } from 'react-icons/io5';
import toast from 'react-hot-toast';

const BookSessionPage = () => {
  const { supporterId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [supporter, setSupporter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [availabilityDates, setAvailabilityDates] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState('');
  const [topic, setTopic] = useState('');
  const [notes, setNotes] = useState('');
  const [booking, setBooking] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Helper: Convert local date to YYYY-MM-DD string (avoiding timezone issues)
  const dateToString = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Fetch peer counselor details
  useEffect(() => {
    const fetchSupporter = async () => {
      try {
        const res = await peerSupporterAPI.getById(supporterId);
        if (res.success) {
          setSupporter(res.data);
          await loadAvailability();
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

  // Load availability data
  const loadAvailability = async () => {
    try {
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      const res = await availabilityApi.getAvailabilityByCounselor(supporterId, dateToString(new Date()), dateToString(nextMonth));
      if (res.success) {
        // Use consistent date string format (YYYY-MM-DD)
        const dates = res.data.map((av) => {
          return av.date instanceof Date 
            ? dateToString(av.date) 
            : (typeof av.date === 'string' ? av.date.split('T')[0] : dateToString(new Date(av.date)));
        });
        setAvailabilityDates([...new Set(dates)]);
      }
    } catch (error) {
      console.error('Error loading availability:', error);
    }
  };

  // Load slots for selected date
  const handleDateSelect = async (day) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const dateStr = dateToString(date);

    setSelectedDate(date);
    setSelectedTime('');
    setLoadingSlots(true);

    try {
      const slotsRes = await sessionApi.getAvailableSlots(supporterId, dateStr);
      if (slotsRes.success) {
        setAvailableSlots(slotsRes.data || []);
      }
    } catch (error) {
      console.error('Error loading slots:', error);
      toast.error('Failed to load available slots');
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  // Handle booking
  const handleBooking = async (e) => {
    e.preventDefault();

    if (!selectedDate) {
      toast.error('Please select a session date');
      return;
    }

    if (!selectedTime) {
      toast.error('Please select a session time');
      return;
    }

    if (!topic.trim()) {
      toast.error('Please enter a topic');
      return;
    }

    setBooking(true);
    try {
      const res = await sessionApi.bookSession({
        supporterId,
        sessionDate: dateToString(selectedDate),
        sessionTime: selectedTime,
        topic,
        notes,
      });

      if (res.success) {
        toast.success('Session booked successfully!');
        navigate('/my-sessions');
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

  // Calendar functions
  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const days = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return days;
  };

  const hasAvailability = (day) => {
    if (!day) return false;
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const dateStr = dateToString(date);
    return availabilityDates.includes(dateStr);
  };

  const handlePrevMonth = () => {
    const today = new Date();
    if (currentMonth.getMonth() > today.getMonth() || currentMonth.getFullYear() > today.getFullYear()) {
      setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
      setSelectedDate(null);
    }
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    setSelectedDate(null);
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

  const calendarDays = generateCalendarDays();
  const monthName = currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' });

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

            <form onSubmit={handleBooking} className="space-y-8">
              {/* Calendar Section */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-4">
                  <FiCalendar className="inline-block w-4 h-4 mr-2" />
                  Select Date *
                </label>

                {/* Month Navigation */}
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-gray-900">{monthName}</h3>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handlePrevMonth}
                      className="p-2 hover:bg-gray-100 rounded-lg transition"
                    >
                      <IoChevronBack className="text-xl" />
                    </button>
                    <button
                      type="button"
                      onClick={handleNextMonth}
                      className="p-2 hover:bg-gray-100 rounded-lg transition"
                    >
                      <IoChevronForward className="text-xl" />
                    </button>
                  </div>
                </div>

                {/* Calendar Grid */}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  {/* Day headers */}
                  <div className="grid grid-cols-7 bg-gray-100 border-b border-gray-200">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                      <div key={day} className="p-2 text-center font-semibold text-gray-700 text-sm">
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* Calendar days */}
                  <div className="grid grid-cols-7">
                    {calendarDays.map((day, idx) => {
                      const isSelected =
                        selectedDate &&
                        day &&
                        selectedDate.getDate() === day &&
                        selectedDate.getMonth() === currentMonth.getMonth();
                      const hasAv = hasAvailability(day);
                      const isToday = day && new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day).toDateString() === new Date().toDateString();
                      const isPast = day && new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day) < new Date();

                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => day && !isPast && handleDateSelect(day)}
                          disabled={!day || isPast || !hasAv}
                          className={`p-3 border border-gray-100 min-h-16 transition ${
                            !day
                              ? 'bg-gray-50'
                              : isPast
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : isSelected
                              ? 'bg-blue-100 border-blue-300'
                              : hasAv
                              ? 'bg-green-50 hover:bg-green-100 cursor-pointer'
                              : 'bg-white text-gray-400 cursor-not-allowed'
                          }`}
                        >
                          <div className="text-right mb-1">
                            {day && (
                              <span className={`inline-block font-semibold text-sm ${isSelected ? 'text-blue-600' : ''}`}>
                                {day}
                              </span>
                            )}
                          </div>
                          {hasAv && day && !isPast && (
                            <div className="text-xs font-medium">
                              {isToday && <span className="bg-yellow-200 text-yellow-900 px-1 rounded">Today</span>}
                              {!isToday && <span className="text-green-700">Available</span>}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Time Slots */}
              {selectedDate && (
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-4">
                    <FiClock className="inline-block w-4 h-4 mr-2" />
                    Select Time *
                  </label>

                  {loadingSlots ? (
                    <div className="text-center text-gray-500 py-4">Loading available slots...</div>
                  ) : availableSlots.length > 0 ? (
                    <div className="grid grid-cols-4 gap-2">
                      {availableSlots.map((slot, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setSelectedTime(slot.time)}
                          className={`p-2 rounded-lg font-medium text-sm transition ${
                            selectedTime === slot.time
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                          }`}
                        >
                          {slot.time}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-gray-500 py-4">No available slots for this date</div>
                  )}
                </div>
              )}

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
                  disabled={booking || !selectedDate || !selectedTime || !topic.trim()}
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
