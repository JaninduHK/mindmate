import React, { useMemo } from 'react';
import { Activity, Clock } from 'lucide-react';

const GuardianLastActive = ({ moods = [], goals = [], isEmergencyActive }) => {
  // Calculate last active time based on most recent mood or goal
  const { lastActiveDate, lastActiveText, inactiveDays } = useMemo(() => {
    if (!moods?.length && !goals?.length) {
      return {
        lastActiveDate: null,
        lastActiveText: 'Never',
        inactiveDays: 7,
      };
    }

    // Get the most recent activity (mood or goal)
    let lastActivityTime = null;

    if (moods?.length > 0) {
      // Moods have date as ISO string (YYYY-MM-DD)
      const mostRecentMood = moods[0]; // Already sorted by most recent
      if (mostRecentMood.date) {
        // Parse date string to Date object (add time component)
        const moodDate = new Date(mostRecentMood.date + 'T23:59:59');
        lastActivityTime = moodDate;
      }
    }

    if (goals?.length > 0 && goals[0].updatedAt) {
      const goalTime = new Date(goals[0].updatedAt);
      if (!lastActivityTime || goalTime > lastActivityTime) {
        lastActivityTime = goalTime;
      }
    }

    if (!lastActivityTime) {
      return {
        lastActiveDate: null,
        lastActiveText: 'Never',
        inactiveDays: 7,
      };
    }

    // Calculate how long ago
    const now = new Date();
    const diffMS = now - lastActivityTime;
    const diffMins = Math.floor(diffMS / (1000 * 60));
    const diffHours = Math.floor(diffMS / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMS / (1000 * 60 * 60 * 24));

    let lastActiveText = '';
    if (diffMins < 1) lastActiveText = 'Just now';
    else if (diffMins < 60) lastActiveText = `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    else if (diffHours < 24) lastActiveText = `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    else if (diffDays < 30) lastActiveText = `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    else lastActiveText = lastActivityTime.toLocaleDateString();

    // Calculate inactive days this week
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const startOfWeek = new Date(today.setDate(diff));
    startOfWeek.setHours(0, 0, 0, 0);

    let inactiveDays = 0;
    if (lastActivityTime < startOfWeek) {
      inactiveDays = 7; // No activity this week
    } else {
      inactiveDays = Math.floor((now - lastActivityTime) / (1000 * 60 * 60 * 24));
    }

    return {
      lastActiveDate: lastActivityTime,
      lastActiveText,
      inactiveDays: Math.min(inactiveDays, 7),
    };
  }, [moods, goals]);

  const getStatusColor = () => {
    if (isEmergencyActive) return 'bg-red-50 border-red-200';
    if (!lastActiveDate) return 'bg-gray-50 border-gray-200';
    
    const now = new Date();
    const diffHours = (now - lastActiveDate) / (1000 * 60 * 60);
    
    if (diffHours < 1) return 'bg-emerald-50 border-emerald-200';
    if (diffHours < 24) return 'bg-blue-50 border-blue-200';
    return 'bg-yellow-50 border-yellow-200';
  };

  const getStatusBadgeColor = () => {
    if (isEmergencyActive) return 'bg-red-100 text-red-700';
    if (!lastActiveDate) return 'bg-gray-200 text-gray-700';
    
    const now = new Date();
    const diffHours = (now - lastActiveDate) / (1000 * 60 * 60);
    
    if (diffHours < 1) return 'bg-emerald-100 text-emerald-700';
    if (diffHours < 24) return 'bg-blue-100 text-blue-700';
    return 'bg-yellow-100 text-yellow-700';
  };

  const getStatusText = () => {
    if (isEmergencyActive) return '🚨 In Emergency';
    if (!lastActiveDate) return 'Never Active';
    
    const now = new Date();
    const diffHours = (now - lastActiveDate) / (1000 * 60 * 60);
    
    if (diffHours < 1) return '✓ Active Now';
    if (diffHours < 24) return '✓ Active Today';
    return '⚠️ Inactive';
  };

  return (
    <div className={`border p-6 rounded-2xl ${getStatusColor()}`}>
      <div className="flex items-center gap-2 mb-4">
        <Activity className="w-5 h-5 text-gray-400" />
        <h3 className="text-lg font-semibold text-gray-900">Activity Status</h3>
      </div>
      
      <div className="space-y-4">
        {/* Last Active Info */}
        <div>
          <p className="text-sm text-gray-600 mb-2">Last Active</p>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-400" />
            <p className="text-sm font-semibold text-gray-900">{lastActiveText}</p>
          </div>
        </div>
        
        {/* Last Active Date & Time */}
        {lastActiveDate && (
          <div>
            <p className="text-xs text-gray-500 font-medium mb-1">Date & Time</p>
            <p className="text-xs text-gray-600 bg-white bg-opacity-50 px-2 py-1 rounded">
              {lastActiveDate.toLocaleString('en-US', { 
                month: 'short', 
                day: 'numeric', 
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
              })}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Based on mood entries or goal updates
            </p>
          </div>
        )}

        {/* Inactivity Days This Week */}
        <div>
          <p className="text-sm text-gray-600 mb-2">Inactive Days This Week</p>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-gray-900">{inactiveDays}</span>
            <span className="text-xs text-gray-500">/ 7 days</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${(inactiveDays / 7) * 100}%` }}
            ></div>
          </div>
        </div>
        
        {/* Status Badge */}
        <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${getStatusBadgeColor()}`}>
          <div className="w-2 h-2 rounded-full bg-current opacity-75"></div>
          {getStatusText()}
        </div>
      </div>
    </div>
  );
};

export default GuardianLastActive;
