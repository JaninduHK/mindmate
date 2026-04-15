import React from 'react';
import { AlertTriangle, AlertCircle, CheckCircle, Zap, Activity, TrendingDown } from 'lucide-react';

const GuardianMoodAlerts = ({ alerts = [], riskAssessment = null }) => {
  const getAlertIcon = (type, severity) => {
    // Critical alerts always get AlertTriangle
    if (severity === 'critical' || type?.includes('critical')) {
      return AlertTriangle;
    }
    if (severity === 'high' || type?.includes('high_risk')) {
      return AlertTriangle;
    }
    if (type?.includes('keyword')) {
      return Zap;
    }
    if (type?.includes('trend') || type?.includes('consecutive')) {
      return TrendingDown;
    }
    return AlertCircle;
  };

  const getAlertColor = (severity) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-50 border-l-4 border-red-600 text-red-900';
      case 'high':
        return 'bg-orange-50 border-l-4 border-orange-600 text-orange-900';
      case 'medium':
        return 'bg-yellow-50 border-l-4 border-yellow-600 text-yellow-900';
      default:
        return 'bg-blue-50 border-l-4 border-blue-600 text-blue-900';
    }
  };

  const getAlertBadgeColor = (severity) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-700 font-bold';
      case 'high':
        return 'bg-orange-100 text-orange-700 font-bold';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-blue-100 text-blue-700';
    }
  };

  const getActionButtonColor = (severity) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-600 hover:bg-red-700 text-white';
      case 'high':
        return 'bg-orange-600 hover:bg-orange-700 text-white';
      case 'medium':
        return 'bg-yellow-600 hover:bg-yellow-700 text-white';
      default:
        return 'bg-blue-600 hover:bg-blue-700 text-white';
    }
  };

  // Show risk assessment if available
  if (alerts && alerts.length === 0 && !riskAssessment?.alertCount) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 p-6 rounded-2xl">
        <div className="flex items-center gap-2 mb-2">
          <CheckCircle className="w-5 h-5 text-emerald-600" />
          <h3 className="text-lg font-semibold text-emerald-900">Mood Status</h3>
        </div>
        <p className="text-sm text-emerald-800">No mood concerns detected. User appears to be doing well. ✨</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Mood Alerts & Concerns</h3>
        {riskAssessment && (
          <div className="text-right">
            <p className="text-sm text-gray-600">Risk Level</p>
            <p className={`text-lg font-bold uppercase ${
              riskAssessment.overallRisk === 'critical' ? 'text-red-600' :
              riskAssessment.overallRisk === 'high' ? 'text-orange-600' :
              riskAssessment.overallRisk === 'medium' ? 'text-yellow-600' :
              'text-emerald-600'
            }`}>
              {riskAssessment.overallRisk}
            </p>
          </div>
        )}
      </div>

      {/* Risk Assessment Summary */}
      {riskAssessment && riskAssessment.riskScore > 0 && (
        <div className="bg-white p-4 rounded-lg border border-gray-200 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Risk Score</span>
            <span className={`text-2xl font-bold ${
              riskAssessment.riskScore >= 70 ? 'text-red-600' :
              riskAssessment.riskScore >= 50 ? 'text-orange-600' :
              riskAssessment.riskScore >= 30 ? 'text-yellow-600' :
              'text-emerald-600'
            }`}>
              {riskAssessment.riskScore}/100
            </span>
          </div>
          
          {/* Risk Factors */}
          {riskAssessment.factors && riskAssessment.factors.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <p className="text-xs font-medium text-gray-600 mb-2">Contributing Factors:</p>
              <ul className="space-y-1">
                {riskAssessment.factors.map((factor, idx) => (
                  <li key={idx} className="text-xs text-gray-600 flex items-start gap-2">
                    <span className="text-red-500 mt-1">•</span>
                    {factor}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommendations */}
          {riskAssessment.recommendations && riskAssessment.recommendations.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <p className="text-xs font-medium text-gray-600 mb-2">Recommendations:</p>
              <ul className="space-y-1">
                {riskAssessment.recommendations.map((rec, idx) => (
                  <li key={idx} className="text-xs text-gray-600 flex items-start gap-2">
                    <span className="text-blue-500 mt-1">→</span>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Individual Alerts */}
      {alerts && alerts.map((alert, index) => {
        const Icon = getAlertIcon(alert.type, alert.severity);
        return (
          <div key={index} className={`border p-5 rounded-lg ${getAlertColor(alert.severity)} transition-all hover:shadow-md`}>
            <div className="flex items-start gap-4">
              <Icon className={`w-6 h-6 flex-shrink-0 mt-0.5 ${
                alert.severity === 'critical' ? 'text-red-600 animate-pulse' :
                alert.severity === 'high' ? 'text-orange-600' :
                'text-yellow-600'
              }`} />
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-sm md:text-base">{alert.title}</h4>
                  <span className={`text-xs px-3 py-1 rounded-full font-medium ${getAlertBadgeColor(alert.severity)}`}>
                    {alert.severity?.toUpperCase()}
                  </span>
                </div>
                
                <p className="text-sm mb-2">{alert.description}</p>

                {/* High-Risk Keywords Display */}
                {alert.keywords && alert.keywords.length > 0 && (
                  <div className="mb-3 p-3 bg-white bg-opacity-60 rounded border border-current border-opacity-20">
                    <p className="text-xs font-medium mb-1">Concerning Keywords Detected:</p>
                    <div className="flex flex-wrap gap-2">
                      {alert.keywords.map((keyword, idx) => (
                        <span key={idx} className={`text-xs px-2.5 py-1 rounded font-semibold ${
                          alert.severity === 'critical' ? 'bg-red-200 text-red-900' :
                          alert.severity === 'high' ? 'bg-orange-200 text-orange-900' :
                          'bg-yellow-200 text-yellow-900'
                        }`}>
                          "{keyword}"
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Full Description for Critical Alerts */}
                {alert.fullDescription && alert.severity === 'critical' && (
                  <div className="mb-3 p-3 bg-white bg-opacity-60 rounded border border-current border-opacity-20">
                    <p className="text-xs font-medium mb-1">User's Statement:</p>
                    <p className="text-sm italic">"{alert.fullDescription}"</p>
                  </div>
                )}

                {/* Recommendation */}
                {alert.recommendation && (
                  <div className={`p-2 rounded text-xs mb-3 ${
                    alert.severity === 'critical' ? 'bg-red-100 text-red-800' :
                    alert.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    <strong>Action:</strong> {alert.recommendation}
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-current border-opacity-20">
                  <p className="text-xs opacity-75">
                    {alert.date && new Date(alert.date).toLocaleDateString()} {alert.date && 'at'} {alert.date && new Date(alert.date).toLocaleTimeString()}
                  </p>
                  
                  {alert.actionRequired && (
                    <button className={`text-xs px-3 py-1.5 rounded font-medium transition-colors ${getActionButtonColor(alert.severity)}`}>
                      {alert.severity === 'critical' ? 'Contact Now' : 'Follow Up'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default GuardianMoodAlerts;
