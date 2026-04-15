import { CheckCircle2, Trash2, AlertCircle, Info } from 'lucide-react';
import { timeAgo } from '../../../utils/dateUtils.js';

const NotificationItem = ({ notification, onMarkAsRead, onDelete, isDeletingNotification }) => {
  const typeConfig = {
    emergency: {
      icon: AlertCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-l-red-600',
    },
    alert: {
      icon: AlertCircle,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-l-yellow-600',
    },
    info: {
      icon: Info,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-l-blue-600',
    },
    default: {
      icon: Info,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
      borderColor: 'border-l-gray-600',
    },
  };

  const config = typeConfig[notification.type] || typeConfig.default;
  const IconComponent = config.icon;

  return (
    <div
      className={`border-l-4 rounded-lg p-4 mb-3 ${config.bgColor} ${config.borderColor} ${
        notification.readAt ? 'opacity-75' : ''
      }`}
    >
      <div className="flex items-start gap-3">
        <IconComponent className={`w-5 h-5 ${config.color} flex-shrink-0 mt-0.5`} />

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 line-clamp-1">
            {notification.title}
          </h3>
          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
            {notification.message}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            {timeAgo(notification.createdAt)}
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-2 ml-4 flex-shrink-0">
          {!notification.readAt && (
            <button
              onClick={() => onMarkAsRead(notification._id)}
              className="p-1 hover:bg-gray-200 rounded transition-colors"
              title="Mark as read"
            >
              <CheckCircle2 className="w-4 h-4 text-gray-400" />
            </button>
          )}
          <button
            onClick={() => onDelete(notification._id)}
            disabled={isDeletingNotification}
            className="p-1 hover:bg-red-100 rounded transition-colors disabled:opacity-50"
            title="Delete"
          >
            <Trash2 className="w-4 h-4 text-red-500" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationItem;
