import { createContext, useState, useCallback } from 'react';

export const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [messageNotifications, setMessageNotifications] = useState([]);

  const addMessageNotification = useCallback((message) => {
    const notification = {
      id: Date.now(),
      senderId: message.senderId,
      senderName: message.senderName,
      message: message.message,
      groupId: message.groupId,
      groupName: message.groupName,
      isGroupMessage: message.isGroupMessage || false,
      timestamp: message.timestamp,
    };
    
    setMessageNotifications((prev) => [notification, ...prev.slice(0, 19)]);
    setUnreadMessages((prev) => prev + 1);
  }, []);

  const clearMessageNotifications = useCallback(() => {
    setUnreadMessages(0);
    setMessageNotifications([]);
  }, []);

  const removeMessageNotification = useCallback((id) => {
    setMessageNotifications((prev) => prev.filter((n) => n.id !== id));
    setUnreadMessages((prev) => Math.max(0, prev - 1));
  }, []);

  const decrementUnreadMessages = useCallback(() => {
    setUnreadMessages((prev) => Math.max(0, prev - 1));
  }, []);

  const value = {
    unreadMessages,
    messageNotifications,
    addMessageNotification,
    clearMessageNotifications,
    removeMessageNotification,
    decrementUnreadMessages,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
