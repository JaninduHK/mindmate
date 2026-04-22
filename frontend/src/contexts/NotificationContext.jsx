import { createContext, useState, useCallback } from 'react';

export const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [messageNotifications, setMessageNotifications] = useState([]);

  const addMessageNotification = useCallback((message) => {
    setMessageNotifications((prev) => [
      { id: Date.now(), ...message },
      ...prev.slice(0, 9),
    ]);
    setUnreadMessages((prev) => prev + 1);
  }, []);

  const clearMessageNotifications = useCallback(() => {
    setUnreadMessages(0);
    setMessageNotifications([]);
  }, []);

  const decrementUnreadMessages = useCallback(() => {
    setUnreadMessages((prev) => Math.max(0, prev - 1));
  }, []);

  const value = {
    unreadMessages,
    messageNotifications,
    addMessageNotification,
    clearMessageNotifications,
    decrementUnreadMessages,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
