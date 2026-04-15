import { useState, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { Users, AlertCircle, Calendar, TrendingUp } from 'lucide-react';
import { useGuardianLinkedUsers, useGuardianSummary, useGuardianNotifications } from '../../../hooks/emergency/useGuardianSummary.js';
import { useEmergency } from '../../../context/EmergencyContext.jsx';
import EmergencyBanner from '../../../components/emergency/emergency/EmergencyBanner.jsx';
import NotificationList from '../../../components/emergency/notifications/NotificationList.jsx';

const GuardianDashboardPage = () => {
  const [selectedUserId, setSelectedUserId] = useState(null);

  // Get list of linked users
  const { data: linkedUsers, isLoading: isLoadingUsers } = useGuardianLinkedUsers();

  // Set default selected user
  useMemo(() => {
    if (linkedUsers?.length > 0 && !selectedUserId) {
      setSelectedUserId(linkedUsers[0]._id);
    }
  }, [linkedUsers, selectedUserId]);

  // Get summary for selected user
  const { data: summary, isLoading: isLoadingSummary } = useGuardianSummary(selectedUserId, {
    enabled: !!selectedUserId,
  });

  // Get notifications for selected user
  const { data: notifications, isLoading: isLoadingNotifications } = useGuardianNotifications(selectedUserId, {}, {
    enabled: !!selectedUserId,
  });

  const selectedUser = linkedUsers?.find((u) => u._id === selectedUserId);
  const isEmergencyActive = summary?.isEmergencyActive;

  // Get recent emergency contacts
  const emergencyContacts = summary?.emergencyContacts || [];

  return (
    <>
      <Helmet>
        <title>Guardian Dashboard - MindMate</title>
      </Helmet>

      {/* Emergency Banner for Linked User */}
      {isEmergencyActive && <EmergencyBanner />}

      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container-custom">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3 mb-2">
              <Users className="w-8 h-8 text-primary-600" />
              Guardian Dashboard
            </h1>
            <p className="text-gray-600">
              Monitor and support the people you care about
            </p>
          </div>

          {isLoadingUsers ? (
            <div className="h-32 bg-gray-200 rounded-2xl animate-pulse" />
          ) : linkedUsers?.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                No Linked Users
              </h2>
              <p className="text-gray-600 max-w-sm mx-auto">
                You haven't been added as an emergency contact yet. Wait for someone to invite you as an emergency contact.
              </p>
            </div>
          ) : (
            <>
              {/* User Selector */}
              <div className="mb-8">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Select Person to Monitor
                </label>
                <select
                  value={selectedUserId || ''}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full max-w-xs px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {linkedUsers?.map((user) => (
                    <option key={user._id} value={user._id}>
                      {user.name} ({user.email})
                    </option>
                  ))}
                </select>
              </div>

              {isLoadingSummary ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-40 bg-gray-200 rounded-2xl animate-pulse" />
                  ))}
                </div>
              ) : summary ? (
                <>
                  {/* Emergency Status Banner */}
                  {isEmergencyActive && (
                    <div className="mb-8 bg-red-50 border-2 border-red-200 rounded-2xl p-6">
                      <div className="flex items-center gap-3">
                        <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
                        <div>
                          <h3 className="font-semibold text-red-900">
                            Emergency Mode Active
                          </h3>
                          <p className="text-sm text-red-800 mt-1">
                            {selectedUser?.name} activated emergency mode. Their emergency contacts have been notified.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Summary Cards */}
                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {/* Mood Card */}
                    <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                      <p className="text-sm text-gray-600 mb-2">Current Mood</p>
                      <p className="text-3xl font-bold text-gray-900 mb-1">
                        {summary.mood?.emoji} {summary.mood?.label || 'Not recorded'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {summary.mood?.timestamp ? new Date(summary.mood.timestamp).toLocaleDateString() : 'No data'}
                      </p>
                    </div>

                    {/* Activity Card */}
                    <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-gray-600">Activity Level</p>
                        <TrendingUp className="w-4 h-4 text-primary-600" />
                      </div>
                      <p className="text-3xl font-bold text-gray-900 mb-1">
                        {summary.activityLevel || 'Moderate'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {summary.lastActivity ? new Date(summary.lastActivity).toLocaleDateString() : 'No data'}
                      </p>
                    </div>

                    {/* Goals Card */}
                    <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                      <p className="text-sm text-gray-600 mb-2">Active Goals</p>
                      <p className="text-3xl font-bold text-gray-900 mb-1">
                        {summary.activeGoals?.count || 0}
                      </p>
                      {summary.activeGoals?.progress && (
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-primary-600 h-2 rounded-full"
                            style={{ width: `${summary.activeGoals.progress}%` }}
                          ></div>
                        </div>
                      )}
                    </div>

                    {/* Session Card */}
                    <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-gray-600">Last Check-In</p>
                        <Calendar className="w-4 h-4 text-primary-600" />
                      </div>
                      <p className="text-3xl font-bold text-gray-900 mb-1">
                        {summary.lastCheckIn ? (
                          new Date(summary.lastCheckIn).toLocaleDateString()
                        ) : (
                          'None'
                        )}
                      </p>
                      <p className="text-xs text-gray-500">
                        {summary.totalSessions || 0} sessions total
                      </p>
                    </div>
                  </div>

                  {/* Emergency Contacts Notified */}
                  {emergencyContacts.length > 0 && (
                    <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 mb-8">
                      <h3 className="font-semibold text-gray-900 mb-4">
                        Their Emergency Contacts
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {emergencyContacts.map((contact) => (
                          <div
                            key={contact._id}
                            className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                          >
                            <p className="font-medium text-gray-900">{contact.fullName}</p>
                            <p className="text-xs text-gray-600 mt-1">
                              {contact.relationship}
                            </p>
                            <p className="text-xs text-gray-500 mt-2 break-all">
                              {contact.email}
                            </p>
                            {contact.phoneNumber && (
                              <p className="text-xs text-gray-500">
                                {contact.phoneNumber}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recent Notifications */}
                  <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                    <h3 className="font-semibold text-gray-900 mb-4">
                      Recent Activity
                    </h3>
                    <NotificationList
                      notifications={notifications || []}
                      isEmpty={(notifications || []).length === 0}
                      isLoading={isLoadingNotifications}
                    />
                  </div>
                </>
              ) : null}
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default GuardianDashboardPage;
