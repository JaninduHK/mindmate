import { MessageCircle } from 'lucide-react';
import NotificationItem from './NotificationItem.jsx';

const NotificationList = ({ notifications = [], onMarkAsRead, onDelete, isDeleting, isEmpty, isLoading }) => {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-20 bg-gray-100 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (isEmpty || notifications.length === 0) {
    return (
      <div className="text-center py-12">
        <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600 font-medium">No notifications yet</p>
        <p className="text-sm text-gray-500 mt-1">
          You'll get notified when there are important updates
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {notifications.map((notification) => (
        <NotificationItem
          key={notification._id}
          notification={notification}
          onMarkAsRead={onMarkAsRead}
          onDelete={onDelete}
          isDeletingNotification={isDeleting}
        />
      ))}
    </div>
  );
};

export default NotificationList;
