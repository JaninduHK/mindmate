import { useState, useCallback, useRef } from 'react';
import MoodPage from './MoodPage';
import GoalPage from './GoalPage';
import AnalyticsPage from './AnalyticsPage';

const TABS = [
  { id: 'mood', label: 'Mood Tracking' },
  { id: 'goals', label: 'Goals' },
  { id: 'analytics', label: 'Analytics' },
];

export default function PersonalTrackingPage() {
  const [activeTab, setActiveTab] = useState('mood');
  const analyticsRefreshTrigger = useRef(0);
  const [analyticsRefresh, setAnalyticsRefresh] = useState(0);

  const triggerAnalyticsRefresh = useCallback(() => {
    analyticsRefreshTrigger.current += 1;
    setAnalyticsRefresh(analyticsRefreshTrigger.current);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        {/* Header Section */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight sm:text-5xl">
            Personal Tracking System
          </h1>
          <p className="mt-3 text-lg text-gray-600 max-w-2xl mx-auto">
            Track your mood, manage goals, and review insights all in one place.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex bg-white/50 backdrop-blur-sm rounded-full p-1 shadow-sm border border-gray-200">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  relative px-6 py-2.5 text-sm font-medium rounded-full transition-all duration-200
                  ${
                    activeTab === tab.id
                      ? 'bg-primary-600 text-white shadow-md'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }
                `}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <span className="absolute inset-0 rounded-full bg-primary-600 -z-10 animate-pulse-subtle" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="mt-8">
          {activeTab === 'mood' && <MoodPage onMoodAdded={triggerAnalyticsRefresh} />}
          {activeTab === 'goals' && <GoalPage onGoalAdded={triggerAnalyticsRefresh} />}
          {activeTab === 'analytics' && <AnalyticsPage refreshTrigger={analyticsRefresh} />}
        </div>
      </div>
    </div>
  );
}