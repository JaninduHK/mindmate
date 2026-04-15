import React, { useEffect, useState } from 'react';
import { AlertTriangle, Users } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import guardianApi from '../api/guardianApi';
import GuardianEmergencyBanner from '../components/guardian/GuardianEmergencyBanner';
import GuardianAnalytics from '../components/guardian/GuardianAnalytics';
import GuardianDailyAnalytics from '../components/guardian/GuardianDailyAnalytics';
import GuardianMoodAlerts from '../components/guardian/GuardianMoodAlerts';
import GuardianEmergencyContacts from '../components/guardian/GuardianEmergencyContacts';
import GuardianLastActive from '../components/guardian/GuardianLastActive';
import AnalyticsSummary from '../components/personalTracking/AnalyticsSummary';

const GuardianDashboard = () => {
  const { user: authUser } = useAuth();
  const [monitoredUsers, setMonitoredUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [moodAnalytics, setMoodAnalytics] = useState(null);
  const [dailyAnalytics, setDailyAnalytics] = useState(null);
  const [moodAlerts, setMoodAlerts] = useState([]);
  const [goalAnalytics, setGoalAnalytics] = useState(null);
  const [analyticsSummary, setAnalyticsSummary] = useState(null);
  const [riskAssessment, setRiskAssessment] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  // Fetch monitored users on component mount
  useEffect(() => {
    const fetchMonitoredUsers = async () => {
      try {
        setLoading(true);
        console.log('[GuardianDashboard] Fetching monitored users...');
        const response = await guardianApi.getMonitoredUsers();
        console.log('[GuardianDashboard] API Response:', response);
        console.log('[GuardianDashboard] Response.data:', response?.data);
        console.log('[GuardianDashboard] Response.data.data:', response?.data?.data);
        
        // Handle the response structure: response.data contains { data: [...] }
        const users = response?.data?.data || [];
        console.log('[GuardianDashboard] Extracted users:', users);
        
        setMonitoredUsers(users);
        
        if (users && users.length > 0) {
          console.log('[GuardianDashboard] Setting selected user to:', users[0]);
          const first = users[0];
          setSelectedUser(first);
          await loadUserData(first.userId || first._id);
        } else {
          console.log('[GuardianDashboard] No users found in response');
        }
      } catch (error) {
        console.error('[GuardianDashboard] Error fetching monitored users:', error);
        setMonitoredUsers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMonitoredUsers();
  }, []);

  // Load all user data when selected user changes
  const loadUserData = async (userId) => {
    if (!userId) return;

    try {
      setAnalyticsLoading(true);

      // Fetch all data in parallel
      const [dashData, moodData, alertsData, goalsData, dailyData, summaryData] = await Promise.all([
        guardianApi.getUserDashboard(userId).catch((err) => { console.error('Dashboard error:', err); return null; }),
        guardianApi.getMoodAnalytics(userId).catch((err) => { console.error('Mood analytics error:', err); return null; }),
        guardianApi.getMoodAlerts(userId).catch((err) => { console.error('Mood alerts error:', err); return null; }),
        guardianApi.getGoalAnalytics(userId).catch((err) => { console.error('Goal analytics error:', err); return null; }),
        guardianApi.getDailyAnalytics(userId).catch((err) => { console.error('Daily analytics error:', err); return null; }),
        guardianApi.getAnalyticsSummary(userId).catch((err) => { console.error('Analytics summary error:', err); return null; }),
      ]);

      console.log('Guardian dashboard data:', { dashData, summaryData, moodData, alertsData, goalsData, dailyData });

      setDashboardData(dashData?.data || null);
      setMoodAnalytics(moodData?.data || null);
      setDailyAnalytics(dailyData?.data || null);
      setAnalyticsSummary(summaryData?.data || null);
      console.log('Analytics summary set to:', summaryData?.data);
      
      // Handle alerts data with risk assessment
      if (alertsData?.data) {
        setMoodAlerts(alertsData.data.data || alertsData.data || []);
        setRiskAssessment(alertsData.data.riskAssessment || null);
      } else {
        setMoodAlerts([]);
        setRiskAssessment(null);
      }
      
      setGoalAnalytics(goalsData?.data || null);
    } catch (error) {
      console.error('Error loading user data:', error);
      setDashboardData(null);
      setMoodAnalytics(null);
      setAnalyticsSummary(null);
      setMoodAlerts([]);
      setRiskAssessment(null);
      setGoalAnalytics(null);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const handleUserChange = (user) => {
    setSelectedUser(user);
    const userId = user.userId || user._id;
    loadUserData(userId);
  };

  if (loading) {
    return (
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-12 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="h-40 bg-gray-200 rounded-2xl"></div>
            <div className="h-40 bg-gray-200 rounded-2xl"></div>
          </div>
          <div className="h-64 bg-gray-200 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  if (monitoredUsers.length === 0) {
    return (
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <Users className="w-16 h-16 text-gray-300 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No Monitored Users</h2>
          <p className="text-gray-500 text-center max-w-md">
            You are not currently monitoring any users. Wait for a user to add you as an emergency contact.
          </p>
        </div>
      </div>
    );
  }

  const userData = dashboardData?.user;

  return (
    <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header with Guardian Welcome */}
      <div className="mb-8">
        {authUser?.name && (
          <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
            <p className="text-emerald-900 font-medium">
              👋 Welcome, <span className="font-bold text-emerald-700">{authUser.name}</span>
            </p>
            <p className="text-emerald-700 text-sm mt-1">
              You're logged in as a guardian. Monitor your assigned users below.
            </p>
          </div>
        )}
        <h1 className="text-3xl font-bold text-gray-900 mb-1">
          Guardian Dashboard
        </h1>
        <p className="text-gray-600">
          Monitor and support {selectedUser?.name || 'your users'}'s mental health and wellbeing.
        </p>
      </div>

      {/* User Selector */}
      {monitoredUsers.length > 1 && (
        <div className="mb-8">
          <label htmlFor="user-select" className="block text-sm font-medium text-gray-700 mb-2">
            Select User to Monitor
          </label>
          <select
            id="user-select"
            value={selectedUser?.userId || ''}
            onChange={(e) => {
              const user = monitoredUsers.find(u => u.userId === e.target.value);
              if (user) handleUserChange(user);
            }}
            className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent block w-full p-3 outline-none transition-colors"
          >
            {monitoredUsers.map((u) => (
              <option key={u.userId} value={u.userId}>
                {u.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Main Content */}
      <div className="space-y-6">
        {/* Emergency Banner - Always displayed if emergency is active or critical risk */}
        {(userData?.emergencyMode || riskAssessment?.overallRisk === 'critical' || riskAssessment?.overallRisk === 'high') && (
          <GuardianEmergencyBanner 
            user={userData} 
            selectedUser={selectedUser?.user}
            riskAssessment={riskAssessment}
          />
        )}

        {/* Daily Analytics Section */}
        <GuardianDailyAnalytics 
          dailyData={dailyAnalytics}
          loading={analyticsLoading}
        />

        {/* Analytics Summary Charts */}
        {analyticsSummary ? (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Analytics & Insights</h2>
              <p className="text-sm text-gray-600 mt-1">
                Mood and goal analytics for {selectedUser?.name}
              </p>
            </div>
            <AnalyticsSummary analytics={analyticsSummary} />
          </div>
        ) : (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Analytics & Insights</h2>
              <p className="text-sm text-gray-600 mt-1">
                Mood and goal analytics for {selectedUser?.name}
              </p>
            </div>
            <p className="text-gray-500 text-center py-8">Loading analytics data...</p>
          </div>
        )}

        {/* Two Column Layout: Left side for updates, Right side for status */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content Area (takes 2 columns) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Mood Alerts Section */}
            {(moodAlerts.length > 0 || riskAssessment?.alertCount > 0) && (
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <GuardianMoodAlerts alerts={moodAlerts} riskAssessment={riskAssessment} />
              </div>
            )}

            {/* Analytics Section */}
            <GuardianAnalytics 
              moodAnalytics={moodAnalytics}
              goalAnalytics={goalAnalytics}
              loading={analyticsLoading}
            />
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Last Active */}
            <GuardianLastActive 
              lastActiveTime={userData?.lastActiveTime}
              isEmergencyActive={userData?.emergencyMode}
            />

            {/* Emergency Contacts */}
            <GuardianEmergencyContacts contacts={dashboardData?.emergencyContacts} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuardianDashboard;
