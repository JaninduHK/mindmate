import React from 'react';
import { Activity, Clock } from 'lucide-react';

const GuardianLastActive = ({ lastActiveTime, isEmergencyActive }) => {
  const getLastActiveText = () => {
    if (!lastActiveTime) return 'Never';
    
    const lastActive = new Date(lastActiveTime);
    const now = new Date();
    const diffMS = now - lastActive;
    const diffMins = Math.floor(diffMS / (1000 * 60));
    const diffHours = Math.floor(diffMS / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMS / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 30) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return lastActive.toLocaleDateString();
  };

  // Calculate inactivity days this week
  const getInactivityDaysThisWeek = () => {
    if (!lastActiveTime) return 7; // All days inactive if never active
    
    const lastActive = new Date(lastActiveTime);
    const now = new Date();
    const diffMS = now - lastActive;
    const diffDays = Math.floor(diffMS / (1000 * 60 * 60 * 24));
    
    // Get start of this week (Monday)
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Adjust for Sunday
    const startOfWeek = new Date(today.setDate(diff));
    startOfWeek.setHours(0, 0, 0, 0);
    
    const lastActiveDate = new Date(lastActiveTime);
    
    if (lastActiveDate < startOfWeek) {
      // No activity this week
      return 7;
    } else {
      // Had activity this week - calculate days since last activity
      const daysInactive = Math.floor((now - lastActiveDate) / (1000 * 60 * 60 * 24));
      return daysInactive;
    }
  };

  const getStatusColor = () => {
    if (isEmergencyActive) return 'bg-red-50 border-red-200';
    if (!lastActiveTime) return 'bg-gray-50 border-gray-200';
    
    const lastActive = new Date(lastActiveTime);
    const now = new Date();
    const diffHours = (now - lastActive) / (1000 * 60 * 60);
    
    if (diffHours < 1) return 'bg-emerald-50 border-emerald-200';
    if (diffHours < 24) return 'bg-blue-50 border-blue-200';
    return 'bg-yellow-50 border-yellow-200';
  };

  const getStatusBadgeColor = () => {
    if (isEmergencyActive) return 'bg-red-100 text-red-700';
    if (!lastActiveTime) return 'bg-gray-200 text-gray-700';
    
    const lastActive = new Date(lastActiveTime);
    const now = new Date();
    const diffHours = (now - lastActive) / (1000 * 60 * 60);
    
    if (diffHours < 1) return 'bg-emerald-100 text-emerald-700';
    if (diffHours < 24) return 'bg-blue-100 text-blue-700';
    return 'bg-yellow-100 text-yellow-700';
  };

  const getStatusText = () => {
    if (isEmergencyActive) return '🚨 In Emergency';
    if (!lastActiveTime) return 'Never Active';
    
    const lastActive = new Date(lastActiveTime);
    const now = new Date();
    const diffHours = (now - lastActive) / (1000 * 60 * 60);
    
    if (diffHours < 1) return '✓ Active Now';
    if (diffHours < 24) return '✓ Active Today';
    return '⚠️ Inactive';
  };

  const inactiveDays = getInactivityDaysThisWeek();

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
            <p className="text-sm font-semibold text-gray-900">{getLastActiveText()}</p>
          </div>
        </div>
        
        {/* Last Active Date & Time */}
        {lastActiveTime && (
          <div>
            <p className="text-xs text-gray-500 font-medium mb-1">Date & Time</p>
            <p className="text-xs text-gray-600 bg-white bg-opacity-50 px-2 py-1 rounded">
              {new Date(lastActiveTime).toLocaleString('en-US', { 
                month: 'short', 
                day: 'numeric', 
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
              })}
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
