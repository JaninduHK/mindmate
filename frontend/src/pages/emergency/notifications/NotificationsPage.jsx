import { useState } from 'react';
import { Helmet } from 'react-helmet';
import { Bell, CheckCheck } from 'lucide-react';
import { useNotifications } from '../../../hooks/emergency/useNotifications.js';
import NotificationList from '../../../components/emergency/notifications/NotificationList.jsx';
import Button from '../../../components/common/Button.jsx';

const NotificationsPage = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [filters, setFilters] = useState({});

  // Update filters based on active tab
  const tabFilters = activeTab === 'all' ? {} : { type: activeTab };

  const { notifications, isLoading, markAsRead, markAllAsRead, deleteNotification, isDeletingNotification } = useNotifications(tabFilters);

  const tabs = [
    { id: 'all', label: 'All', count: notifications.length },
    { id: 'emergency', label: 'Emergency', count: notifications.filter(n => n.type === 'emergency').length },
    { id: 'alert', label: 'Alerts', count: notifications.filter(n => n.type === 'alert').length },
    { id: 'info', label: 'Info', count: notifications.filter(n => n.type === 'info').length },
  ];

  const unreadCount = notifications.filter(n => !n.readAt).length;

  return (
    <>
      <Helmet>
        <title>Notifications - MindMate</title>
      </Helmet>

      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container-custom">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                  <Bell className="w-8 h-8 text-primary-600" />
                  Notifications
                </h1>
                {unreadCount > 0 && (
                  <p className="text-gray-600 mt-2">
                    You have <strong>{unreadCount}</strong> unread notification{unreadCount !== 1 ? 's' : ''}
                  </p>
                )}
              </div>
              {unreadCount > 0 && (
                <Button
                  variant="outline"
                  onClick={markAllAsRead}
                  className="flex items-center gap-2"
                >
                  <CheckCheck className="w-4 h-4" />
                  Mark All as Read
                </Button>
              )}
            </div>

            {/* Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors ${
                    activeTab === tab.id
                      ? 'bg-primary-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  {tab.label}
                  {tab.count > 0 && (
                    <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-semibold ${
                      activeTab === tab.id
                        ? 'bg-primary-700 text-white'
                        : 'bg-gray-200 text-gray-700'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Notifications List */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <NotificationList
              notifications={notifications}
              onMarkAsRead={markAsRead}
              onDelete={deleteNotification}
              isDeleting={isDeletingNotification}
              isEmpty={notifications.length === 0}
              isLoading={isLoading}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default NotificationsPage;
