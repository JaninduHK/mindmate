import React, { useState } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  isSameDay,
  addDays,
  parseISO
} from 'date-fns';

const MOOD_COLORS = {
  Positive: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  Stable: 'bg-blue-100 text-blue-700 border-blue-200',
  Pressure: 'bg-amber-100 text-amber-700 border-amber-200',
  Low: 'bg-red-100 text-red-700 border-red-200',
};

const GuardianCalendar = ({ moods = [] }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  const onDateClick = day => {
    setSelectedDate(day);
  };

  const getMoodForDate = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return moods.find(m => m.date === dateStr);
  };

  const selectedMood = getMoodForDate(selectedDate);

  const renderHeader = () => {
    return (
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-indigo-600" />
          <h2 className="text-xl font-bold text-gray-800">
            {format(currentDate, 'MMMM yyyy')}
          </h2>
        </div>
        <div className="flex gap-2">
          <button onClick={prevMonth} className="p-2 border rounded-md hover:bg-gray-50">
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <button onClick={nextMonth} className="p-2 border rounded-md hover:bg-gray-50">
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>
    );
  };

  const renderDays = () => {
    const dateFormat = 'EEEE';
    const days = [];
    let startDate = startOfWeek(currentDate);

    for (let i = 0; i < 7; i++) {
      days.push(
        <div className="text-center font-medium text-sm text-gray-500 py-2" key={i}>
          {format(addDays(startDate, i), dateFormat).substring(0, 3)}
        </div>
      );
    }
    return <div className="grid grid-cols-7 mb-2">{days}</div>;
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const dateFormat = 'd';
    const rows = [];
    let days = [];
    let day = startDate;
    let formattedDate = '';

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        formattedDate = format(day, dateFormat);
        const cloneDay = day;
        const moodObj = getMoodForDate(cloneDay);
        
        let cellClass = "p-2 border rounded-md flex justify-center items-center h-12 cursor-pointer transition-colors relative ";
        
        if (!isSameMonth(day, monthStart)) {
          cellClass += "text-gray-300 bg-gray-50";
        } else if (isSameDay(day, selectedDate)) {
          cellClass += "text-white bg-indigo-600 font-bold border-indigo-700 " + (moodObj ? "" : "shadow-md");
        } else {
          cellClass += "text-gray-800 hover:bg-indigo-50 border-gray-100";
        }

        // Apply mood styling
        if (moodObj && isSameMonth(day, monthStart)) {
          const colorClass = MOOD_COLORS[moodObj.mood];
          if (isSameDay(day, selectedDate)) {
             // Let indigo override but keep a ring
             cellClass += " ring-2 ring-indigo-300";
          } else if (colorClass) {
             cellClass = cellClass.replace("border-gray-100", "").replace("text-gray-800", "");
             cellClass += ` ${colorClass}`;
          }
        }

        days.push(
          <div
            className={cellClass}
            key={day}
            onClick={() => onDateClick(cloneDay)}
          >
            <span>{formattedDate}</span>
            {moodObj && (
               <div className="absolute top-1 right-1 w-2 h-2 rounded-full hidden sm:block" 
                    style={{backgroundColor: moodObj.mood === 'Low' ? '#EF4444' : moodObj.mood === 'Positive' ? '#10B981' : moodObj.mood === 'Pressure' ? '#F59E0B' : '#3B82F6'}}></div>
            )}
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div className="grid grid-cols-7 gap-1 md:gap-2 mb-1 md:mb-2" key={day}>
          {days}
        </div>
      );
      days = [];
    }
    return <div>{rows}</div>;
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          {renderHeader()}
          {renderDays()}
          {renderCells()}
        </div>
        
        {/* Selected Date Details */}
        <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
          <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">
            Details for {format(selectedDate, 'do MMM yyyy')}
          </h3>
          
          {selectedMood ? (
            <div className="space-y-4">
               <div>
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Mood</span>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold capitalize ${MOOD_COLORS[selectedMood.mood]}`}>
                    {selectedMood.mood}
                  </span>
               </div>
               
               <div>
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Keyword</span>
                  <p className="text-gray-800 font-medium">{selectedMood.keyword}</p>
               </div>
               
               <div>
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Description</span>
                  <p className="text-gray-600 text-sm whitespace-pre-wrap leading-relaxed">{selectedMood.description}</p>
               </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400">
              <CalendarIcon className="w-12 h-12 mb-2 opacity-50" />
              <p className="text-sm">No mood logged for this date.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GuardianCalendar;
