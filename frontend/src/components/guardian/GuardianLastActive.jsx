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
    if (!lastActiveTime) return 'Inactive';
    
    const lastActive = new Date(lastActiveTime);
    const now = new Date();
    const diffHours = (now - lastActive) / (1000 * 60 * 60);
    
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
      
      <div className="space-y-3">
        <div>
          <p className="text-sm text-gray-600 mb-2">Last active</p>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-400" />
            <p className="text-sm font-semibold text-gray-900">{getLastActiveText()}</p>
          </div>
        </div>
        
        {lastActiveTime && (
          <p className="text-xs text-gray-500">
            {new Date(lastActiveTime).toLocaleString()}
          </p>
        )}
        
        <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${getStatusBadgeColor()}`}>
          <div className="w-2 h-2 rounded-full bg-current opacity-75"></div>
          {getStatusText()}
        </div>
      </div>
    </div>
  );
};

export default GuardianLastActive;
