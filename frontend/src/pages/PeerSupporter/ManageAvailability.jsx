import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import * as availabilityApi from '../../api/availability.api';
import toast from 'react-hot-toast';
import { IoChevronBack, IoAdd, IoTrash } from 'react-icons/io5';

const ManageAvailability = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [availabilities, setAvailabilities] = useState([]);
  const [showSlotForm, setShowSlotForm] = useState(false);
  const [formData, setFormData] = useState({
    startTime: '09:00',
    endTime: '10:00',
    slotDuration: 60,
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Helper: Convert local date to YYYY-MM-DD string (avoiding timezone issues)
  const dateToString = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Helper: Parse YYYY-MM-DD string as local date
  const stringToDate = (dateStr) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  // Helper: Extract and normalize date string from any format (ISO string, Date object, or YYYY-MM-DD)
  const extractDateString = (dateValue) => {
    if (typeof dateValue === 'string') {
      // If it's an ISO string like "2024-04-10T00:00:00.000Z", extract just the date part
      if (dateValue.includes('T')) {
        return dateValue.split('T')[0];
      }
      // Otherwise assume it's already in YYYY-MM-DD format
      return dateValue;
    } else if (dateValue instanceof Date) {
      return dateToString(dateValue);
    }
    // Fallback
    return '';
  };

  // Check if logged in user is peer supporter
  useEffect(() => {
    if (user && user.role !== 'peer_supporter') {
      toast.error('Only peer supporters can manage availability');
      navigate('/');
    }
  }, [user, navigate]);

  // Load availability slots
  const loadAvailability = async () => {
    try {
      setLoading(true);
      const response = await availabilityApi.getMyAvailability();
      setAvailabilities(response.data || []);
    } catch (error) {
      console.error('Error loading availability:', error);
      toast.error('Failed to load availability slots');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAvailability();
  }, []);

  // Get dates with availability highlighted
  const getDatesWithAvailability = () => {
    const dates = {};
    availabilities.forEach((av) => {
      // Use the normalized date extraction helper
      const dateStr = extractDateString(av.date);
      
      if (dateStr && dateStr.length >= 10) {
        if (!dates[dateStr]) {
          dates[dateStr] = [];
        }
        dates[dateStr].push(av);
      }
    });
    return dates;
  };

  // Get days for calendar
  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  // Generate calendar days
  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];

    // Empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    // Days of month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return days;
  };

  // Check if date has availability
  const hasAvailability = (day) => {
    if (!day) return false;
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const dateStr = dateToString(date);
    const datesWithAv = getDatesWithAvailability();
    return dateStr in datesWithAv;
  };

  // Get availability for selected date
  const getAvailabilityForDate = (date) => {
    const dateStr = dateToString(date);
    const datesWithAv = getDatesWithAvailability();
    return datesWithAv[dateStr] || [];
  };

  // Handle date selection
  const handleDateClick = (day) => {
    if (!day) return;
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    setSelectedDate(date);
    setShowSlotForm(false);
  };

  // Handle form change
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'slotDuration' ? parseInt(value) : value,
    });
  };

  // Add availability slot
  const handleAddSlot = async (e) => {
    e.preventDefault();
    if (!selectedDate) {
      toast.error('Please select a date');
      return;
    }

    if (!formData.startTime) {
      toast.error('Please enter start time');
      return;
    }

    if (!formData.endTime) {
      toast.error('Please enter end time');
      return;
    }

    if (formData.startTime >= formData.endTime) {
      toast.error('End time must be after start time');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        date: dateToString(selectedDate),
        startTime: formData.startTime,
        endTime: formData.endTime,
        slotDuration: formData.slotDuration,
        notes: formData.notes,
      };

      console.log('Adding availability with payload:', payload);

      const response = await availabilityApi.addAvailability(payload);
      
      if (response.success) {
        // Immediately update state for real-time highlight
        const newSlot = {
          _id: response.data?._id || Date.now().toString(),
          date: payload.date,
          startTime: payload.startTime,
          endTime: payload.endTime,
          slotDuration: payload.slotDuration,
          notes: payload.notes,
        };
        setAvailabilities([...availabilities, newSlot]);
        
        toast.success('Availability slot added successfully');
        setFormData({
          startTime: '09:00',
          endTime: '10:00',
          slotDuration: 60,
          notes: '',
        });
        setShowSlotForm(false);
        // Reload in background for data consistency
        loadAvailability();
      } else {
        toast.error(response.message || 'Failed to add availability');
      }
    } catch (error) {
      console.error('Error adding availability:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Failed to add availability';
      toast.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  // Delete availability slot
  const handleDeleteSlot = async (slotId) => {
    if (!window.confirm('Are you sure you want to delete this slot?')) return;

    try {
      // Immediately remove from state for real-time update
      setAvailabilities(availabilities.filter(av => av._id !== slotId));
      
      await availabilityApi.deleteAvailability(slotId);
      toast.success('Slot deleted successfully');
      // Reload in background for data consistency
      loadAvailability();
    } catch (error) {
      console.error('Error deleting availability:', error);
      toast.error('Failed to delete slot');
      // Reload on error to sync state
      loadAvailability();
    }
  };

  // Move to previous month
  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    setSelectedDate(null);
  };

  // Move to next month
  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    setSelectedDate(null);
  };

  const calendarDays = generateCalendarDays();
  const selectedSlots = selectedDate ? getAvailabilityForDate(selectedDate) : [];
  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-200 rounded-lg transition"
            title="Go back"
          >
            <IoChevronBack className="text-2xl" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Manage Availability</h1>
            <p className="text-gray-600 mt-1">Set your available time slots for sessions</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Calendar Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6">
              {/* Month Navigation */}
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">{monthName}</h2>
                <div className="flex gap-2">
                  <button
                    onClick={handlePrevMonth}
                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-lg transition font-medium"
                  >
                    ← Previous
                  </button>
                  <button
                    onClick={handleNextMonth}
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition font-medium"
                  >
                    Next →
                  </button>
                </div>
              </div>

              {/* Calendar Grid */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                {/* Day headers */}
                <div className="grid grid-cols-7 bg-gray-100 border-b border-gray-200">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                    <div key={day} className="p-3 text-center font-semibold text-gray-700 text-sm">
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
                      selectedDate.getMonth() === currentDate.getMonth();
                    const hasAv = hasAvailability(day);

                    return (
                      <div
                        key={idx}
                        onClick={() => handleDateClick(day)}
                        className={`p-3 border border-gray-100 min-h-24 cursor-pointer transition ${
                          !day
                            ? 'bg-gray-50'
                            : isSelected
                            ? 'bg-blue-100 border-blue-300'
                            : hasAv
                            ? 'bg-green-50 hover:bg-green-100'
                            : 'bg-white hover:bg-gray-50'
                        }`}
                      >
                        <div className="text-right mb-1">
                          {day && (
                            <span className={`inline-block font-semibold ${isSelected ? 'text-blue-600' : 'text-gray-900'}`}>
                              {day}
                            </span>
                          )}
                        </div>
                        {hasAv && day && (
                          <div className="text-xs space-y-1">
                            {getAvailabilityForDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day)).map(
                              (av, i) => (
                                <div key={i} className="bg-green-300 text-green-900 px-2 py-1 rounded text-center">
                                  {av.startTime}-{av.endTime}
                                </div>
                              )
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Legend */}
              <div className="mt-4 flex gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-50 border border-green-300 rounded"></div>
                  <span>Has availability</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-100 border border-blue-300 rounded"></div>
                  <span>Selected date</span>
                </div>
              </div>
            </div>
          </div>

          {/* Selected Date Details */}
          <div className="space-y-6">
            {selectedDate && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  {selectedDate.toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </h3>

                {/* Time Slots */}
                {selectedSlots.length > 0 && (
                  <div className="mb-6">
                    <h4 className="font-semibold text-gray-900 mb-3">Your Time Slots</h4>
                    <div className="space-y-2">
                      {selectedSlots.map((slot) => (
                        <div key={slot._id} className="bg-green-50 border border-green-200 rounded-lg p-3">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="font-medium text-gray-900">
                                {slot.startTime} - {slot.endTime}
                              </p>
                              <p className="text-sm text-gray-600">{slot.slotDuration}min slots</p>
                            </div>
                            <button
                              onClick={() => handleDeleteSlot(slot._id)}
                              className="text-red-500 hover:text-red-700 p-1 transition"
                              title="Delete slot"
                            >
                              <IoTrash className="text-lg" />
                            </button>
                          </div>
                          {slot.notes && <p className="text-sm text-gray-600 italic">{slot.notes}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Add New Slot Form */}
                {!showSlotForm ? (
                  <button
                    onClick={() => setShowSlotForm(true)}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg font-medium transition flex items-center justify-center gap-2"
                  >
                    <IoAdd className="text-lg" />
                    Add Time Slot
                  </button>
                ) : (
                  <form onSubmit={handleAddSlot} className="space-y-4">
                    <div>
                      <label className="block font-medium text-gray-700 mb-1">Start Time</label>
                      <input
                        type="time"
                        name="startTime"
                        value={formData.startTime}
                        onChange={handleFormChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block font-medium text-gray-700 mb-1">End Time</label>
                      <input
                        type="time"
                        name="endTime"
                        value={formData.endTime}
                        onChange={handleFormChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block font-medium text-gray-700 mb-1">Slot Duration (minutes)</label>
                      <select
                        name="slotDuration"
                        value={formData.slotDuration}
                        onChange={handleFormChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value={30}>30 minutes</option>
                        <option value={45}>45 minutes</option>
                        <option value={60}>60 minutes</option>
                        <option value={90}>90 minutes</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-medium text-gray-700 mb-1">Notes (optional)</label>
                      <textarea
                        name="notes"
                        value={formData.notes}
                        onChange={handleFormChange}
                        placeholder="e.g., Only for specific topics"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        rows="2"
                      />
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={submitting}
                        className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white py-2 rounded-lg font-medium transition"
                      >
                        {submitting ? 'Adding...' : 'Add Slot'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowSlotForm(false)}
                        className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-900 py-2 rounded-lg font-medium transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {!selectedDate && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <p className="text-blue-900 text-center">
                  Select a date on the calendar to add or view time slots
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageAvailability;
