import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiBell } from 'react-icons/fi';
import { notificationAPI } from '../../api/notification.api';
import { useNotification } from '../../hooks/useNotification';
import { formatDistanceToNow } from 'date-fns';
import { socket } from '../../socket/socket';

const NotificationBell = () => {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { unreadMessages, messageNotifications, removeMessageNotification, clearMessageNotifications } = useNotification();
  const navigate = useNavigate();
  const ref = useRef(null);

  // Total unread count = system notifications only
  const totalUnread = unreadCount;

  const fetchNotifications = async () => {
    try {
      const res = await notificationAPI.getAll({ limit: 10 });
      if (res.success) {
        setNotifications(res.data.notifications);
        setUnreadCount(res.data.unreadCount);
      }
    } catch {}
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    socket.on('new_notification', (notification) => {
      setUnreadCount((c) => c + 1);
      setNotifications((prev) => [
        { _id: `rt-${Date.now()}`, ...notification },
        ...prev.slice(0, 9),
      ]);
    });
    return () => socket.off('new_notification');
  }, []);

  // Close on outside click
  useEffect(() => {
    const handleClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleMarkAllRead = async () => {
    await notificationAPI.markAllAsRead();
    setUnreadCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    clearMessageNotifications();
  };

  const handleMarkRead = async (id) => {
    await notificationAPI.markAsRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));
  };

  const handleMessageNotificationClick = (notification) => {
    if (notification.isGroupMessage) {
      navigate(`/chat-group/${notification.groupId}`);
    } else {
      navigate(`/chat/${notification.senderId}`);
    }
    removeMessageNotification(notification.id);
    setOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 text-gray-600 hover:text-primary-600 transition-colors"
      >
        <FiBell className="w-5 h-5" />
        {totalUnread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-semibold">
            {totalUnread > 9 ? '9+' : totalUnread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-xl shadow-lg border border-gray-100 z-50 overflow-hidden max-h-[600px] flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 shrink-0">
            <span className="font-semibold text-sm text-gray-900">Notifications</span>
            {totalUnread > 0 && (
              <button onClick={handleMarkAllRead} className="text-xs text-primary-600 hover:underline">
                Mark all read
              </button>
            )}
          </div>

          <div className="overflow-y-auto flex-1 divide-y divide-gray-50">
            {/* System Notifications */}
            {notifications.length === 0 ? (
              <p className="p-4 text-sm text-gray-400 text-center">No notifications</p>
            ) : (
              notifications.map((n) => (
                <div
                  key={n._id}
                  onClick={() => !n.isRead && handleMarkRead(n._id)}
                  className={`px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors ${!n.isRead ? 'bg-primary-50' : ''}`}
                >
                  <p className="text-sm font-medium text-gray-900">{n.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
