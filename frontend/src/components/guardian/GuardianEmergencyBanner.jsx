import React from 'react';
import { ShieldAlert, Phone, AlertTriangle } from 'lucide-react';

const GuardianEmergencyBanner = ({ user, selectedUser, riskAssessment = null }) => {
  if (!user?.emergencyMode && !riskAssessment?.overallRisk) {
    return null;
  }

  // If emergency mode is active
  if (user?.emergencyMode) {
    const activatedTime = new Date(user.emergencyActivatedAt);
    const now = new Date();
    const durationMinutes = Math.floor((now - activatedTime) / (1000 * 60));
    const durationDisplay = durationMinutes < 60 
      ? `${durationMinutes} minutes` 
      : `${Math.floor(durationMinutes / 60)} hours`;

    return (
      <div className="bg-red-50 border-l-4 border-red-600 p-6 rounded-lg">
        <div className="flex items-start gap-4">
          <ShieldAlert className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5 animate-pulse" />
          <div className="flex-1">
            <h2 className="text-lg font-bold text-red-900 mb-1 flex items-center gap-2">
              🚨 EMERGENCY MODE ACTIVE
              <span className="ml-auto inline-block">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-600 text-white text-xs rounded-full font-semibold">
                  <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span> ACTIVE
                </span>
              </span>
            </h2>
            <p className="text-red-800 text-sm mb-3">
              {selectedUser?.name || 'This user'} activated emergency mode <span className="font-semibold">{durationDisplay} ago</span>.
            </p>
            
            {riskAssessment?.overallRisk === 'critical' && (
              <div className="mb-3 p-2 bg-red-100 border border-red-300 rounded text-red-900 text-xs font-medium flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                CRITICAL RISK DETECTED - Immediate action required
              </div>
            )}
            
            <div className="flex gap-3 flex-wrap">
              <a
                href={`tel:${selectedUser?.phoneNumber || '911'}`}
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
              >
                <Phone className="w-4 h-4" /> Call Immediately
              </a>
              {user.emergencyLocation && (
                <button className="inline-flex items-center gap-2 px-4 py-2 bg-white text-red-700 border border-red-300 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors">
                  📍 View Location
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If critical risk but not in emergency mode
  if (riskAssessment?.overallRisk === 'critical') {
    return (
      <div className="bg-red-50 border-l-4 border-red-600 p-6 rounded-lg">
        <div className="flex items-start gap-4">
          <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5 animate-pulse" />
          <div className="flex-1">
            <h2 className="text-lg font-bold text-red-900 mb-1">
              ⚠️ CRITICAL RISK ALERT
            </h2>
            <p className="text-red-800 text-sm mb-3">
              {selectedUser?.name || 'This user'} has shown critical risk indicators and requires immediate attention.
            </p>
            <div className="mb-3 p-2 bg-red-100 border border-red-300 rounded text-red-900 text-xs">
              <p className="font-medium mb-1">Risk Score: {riskAssessment.riskScore}/100</p>
              <p>High-risk keywords detected. Recommend immediate contact and professional assessment.</p>
            </div>
            <div className="flex gap-3 flex-wrap">
              <a
                href={`tel:${selectedUser?.phoneNumber || '911'}`}
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
              >
                <Phone className="w-4 h-4" /> Contact Now
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If high risk but not critical
  if (riskAssessment?.overallRisk === 'high') {
    return (
      <div className="bg-orange-50 border-l-4 border-orange-600 p-6 rounded-lg">
        <div className="flex items-start gap-4">
          <AlertTriangle className="w-6 h-6 text-orange-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h2 className="text-lg font-bold text-orange-900 mb-1">
              ⚠️ HIGH RISK ALERT
            </h2>
            <p className="text-orange-800 text-sm mb-2">
              {selectedUser?.name || 'This user'} has shown concerning mood patterns and elevated risk indicators.
            </p>
            <div className="mb-3 text-xs text-orange-900">
              <p className="font-medium">Risk Score: {riskAssessment.riskScore}/100</p>
            </div>
            <button className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 transition-colors">
              <Phone className="w-4 h-4" /> Reach Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default GuardianEmergencyBanner;
