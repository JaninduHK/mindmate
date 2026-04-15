import { MessageCircle } from 'lucide-react';
import NotificationItem from './NotificationItem.jsx';

const NotificationList = ({ notifications, onMarkAsRead, onDelete, isDeleting, isEmpty, isLoading }) => {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (isEmpty || notifications.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <MessageCircle className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-gray-900 font-semibold mb-2">No notifications yet</h3>
        <p className="text-gray-600 text-sm">
          Your notifications will appear here when you receive them.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {notifications.map((notification) => (
        <NotificationItem
          key={notification._id}
          notification={notification}
          onMarkAsRead={onMarkAsRead}
          onDelete={onDelete}
          isDeleting={isDeleting}
        />
      ))}
    </div>
  );
};

export default NotificationList;
