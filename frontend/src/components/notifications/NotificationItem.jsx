import { CheckCircle2, AlertCircle, Info, Trash2 } from 'lucide-react';
import { timeAgo } from '../../utils/dateUtils.js';

const NotificationItem = ({ notification, onMarkAsRead, onDelete, isDeleting }) => {
  const getTypeIcon = () => {
    switch (notification.type?.toLowerCase()) {
      case 'emergency':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'alert':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-500" />;
      default:
        return <Info className="w-5 h-5 text-gray-500" />;
    }
  };

  const getTypeBgColor = () => {
    switch (notification.type?.toLowerCase()) {
      case 'emergency':
        return 'bg-red-50 border-l-4 border-red-500';
      case 'alert':
        return 'bg-yellow-50 border-l-4 border-yellow-500';
      case 'info':
        return 'bg-blue-50 border-l-4 border-blue-500';
      default:
        return 'bg-gray-50 border-l-4 border-gray-500';
    }
  };

  return (
    <div
      className={`p-4 rounded-xl flex items-start justify-between gap-4 ${getTypeBgColor()} ${
        !notification.readAt ? 'opacity-100' : 'opacity-75'
      }`}
    >
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <div className="flex-shrink-0 mt-0.5">
          {getTypeIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-gray-900 text-sm">
            {notification.title || 'Notification'}
          </h4>
          <p className="text-gray-600 text-sm mt-1">
            {notification.message}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            {timeAgo(notification.createdAt)}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {!notification.readAt && (
          <button
            onClick={() => onMarkAsRead(notification._id)}
            className="p-1.5 hover:bg-white rounded-lg transition-colors"
            title="Mark as read"
          >
            <CheckCircle2 className="w-5 h-5 text-primary-500" />
          </button>
        )}
        
        <button
          onClick={() => onDelete(notification._id)}
          disabled={isDeleting}
          className="p-1.5 hover:bg-white rounded-lg transition-colors disabled:opacity-50"
          title="Delete notification"
        >
          <Trash2 className="w-5 h-5 text-gray-400 hover:text-red-600" />
        </button>
      </div>
    </div>
  );
};

export default NotificationItem;
