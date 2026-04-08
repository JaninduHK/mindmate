import { useState } from 'react';
import { FiCalendar, FiClock, FiCheck, FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';

const ManageAvailability = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [timeSlots, setTimeSlots] = useState({
    Monday: { from: '09:00', to: '17:00', isActive: true },
    Tuesday: { from: '09:00', to: '17:00', isActive: true },
    Wednesday: { from: '09:00', to: '17:00', isActive: true },
    Thursday: { from: '09:00', to: '17:00', isActive: true },
    Friday: { from: '09:00', to: '17:00', isActive: true },
    Saturday: { from: '10:00', to: '14:00', isActive: false },
    Sunday: { from: '', to: '', isActive: false }
  });

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  
  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const handleTimeChange = (day, field, value) => {
    setTimeSlots(prev => ({
      ...prev,
      [day]: { ...prev[day], [field]: value }
    }));
  };

  const handleToggleDay = (day) => {
    setTimeSlots(prev => ({
      ...prev,
      [day]: { ...prev[day], isActive: !prev[day].isActive }
    }));
  };

  const handleSaveAvailability = () => {
    toast.success('Availability saved successfully!');
    // TODO: Send to backend API
    console.log('Saving availability:', timeSlots);
  };

  const handlePrevMonth = () => {
    setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1));
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(selectedDate);
    const firstDay = getFirstDayOfMonth(selectedDate);
    const days = [];

    // Empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="bg-gray-50 h-16"></div>);
    }

    // Days of month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), day);
      const isToday = new Date().toDateString() === date.toDateString();
      
      days.push(
        <div
          key={day}
          onClick={() => setSelectedDate(date)}
          className={`h-16 p-2 border cursor-pointer text-sm font-medium transition-all ${
            selectedDate.getDate() === day && selectedDate.getMonth() === selectedDate.getMonth()
              ? 'bg-primary-600 text-white border-primary-600'
              : isToday
              ? 'bg-blue-50 border-blue-300 text-blue-900'
              : 'bg-white border-gray-200 hover:bg-gray-50'
          }`}
        >
          {day}
        </div>
      );
    }

    return days;
  };

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 py-8">
        <div className="container-custom">
          <div className="flex items-center gap-3 mb-2">
            <FiCalendar className="w-8 h-8 text-primary-600" />
            <h1 className="text-3xl font-bold text-gray-900">Manage Your Availability</h1>
          </div>
          <p className="text-gray-600 mt-2">Set your working hours and availability for peer support sessions</p>
        </div>
      </div>

      <div className="container-custom grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
        {/* Calendar */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-900">Calendar</h2>
            <div className="flex gap-2">
              <button
                onClick={handlePrevMonth}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                ←
              </button>
              <button
                onClick={handleNextMonth}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                →
              </button>
            </div>
          </div>

          <div className="mb-4">
            <h3 className="text-center font-bold text-gray-900">
              {selectedDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </h3>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {dayNames.map(day => (
              <div key={day} className="text-center text-xs font-bold text-gray-600 py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {renderCalendar()}
          </div>
        </div>

        {/* Weekly Schedule */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <FiClock className="w-5 h-5 text-primary-600" />
              Weekly Schedule
            </h2>

            {/* Days of week */}
            <div className="space-y-4">
              {days.map(day => (
                <div key={day} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900">{day}</h3>
                    <button
                      onClick={() => handleToggleDay(day)}
                      className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium transition-all ${
                        timeSlots[day].isActive
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      {timeSlots[day].isActive ? (
                        <>
                          <FiCheck className="w-4 h-4" /> Available
                        </>
                      ) : (
                        <>
                          <FiX className="w-4 h-4" /> Off
                        </>
                      )}
                    </button>
                  </div>

                  {timeSlots[day].isActive && (
                    <div className="flex gap-3 items-center">
                      <div className="flex-1">
                        <label className="text-xs font-medium text-gray-600 block mb-1">From</label>
                        <input
                          type="time"
                          value={timeSlots[day].from}
                          onChange={(e) => handleTimeChange(day, 'from', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="text-xs font-medium text-gray-600 block mb-1">To</label>
                        <input
                          type="time"
                          value={timeSlots[day].to}
                          onChange={(e) => handleTimeChange(day, 'to', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="bg-gradient-to-br from-primary-50 to-teal-50 rounded-2xl shadow-sm border border-primary-200 p-6">
            <h3 className="font-bold text-gray-900 mb-3">Your Availability Summary</h3>
            <div className="space-y-2 text-sm">
              {days.map(day => (
                <div key={day} className="flex justify-between">
                  <span className="text-gray-600">{day}</span>
                  <span className={`font-medium ${timeSlots[day].isActive ? 'text-green-700' : 'text-gray-500'}`}>
                    {timeSlots[day].isActive
                      ? `${timeSlots[day].from} - ${timeSlots[day].to}`
                      : 'Not Available'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSaveAvailability}
            className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 px-6 rounded-lg transition-colors shadow-md hover:shadow-lg"
          >
            Save Availability
          </button>
        </div>
      </div>
    </div>
  );
};

export default ManageAvailability;
