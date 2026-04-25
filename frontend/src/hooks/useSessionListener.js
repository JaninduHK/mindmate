import { useEffect, useCallback } from 'react';
import { useNotification } from './useNotification';
import { socket } from '../socket/socket';

/**
 * Hook to listen for session-related socket.io events
 * Handles: session_booked, session_status_changed
 * Updates global notifications and triggers toasts
 */
export const useSessionListener = () => {
  const { addMessageNotification } = useNotification();

  // Handle new session booking notification (for peer counselors)
  const handleSessionBooked = useCallback((data) => {
    const { sessionId, userId, userName, topic, sessionDate } = data;
    console.log('📅 Session booked event received:', data);

    // Add to global notifications
    addMessageNotification({
      id: sessionId,
      senderId: userId,
      senderName: userName,
      message: `has booked a session with you for ${topic}`,
      isGroupMessage: false,
      groupId: null,
      groupName: null,
      timestamp: new Date(),
      type: 'session_booked',
      sessionId,
    });
  }, [addMessageNotification]);

  // Handle session status changes (for users)
  const handleSessionStatusChanged = useCallback((data) => {
    const { sessionId, newStatus, supporterName, reason } = data;
    console.log('🔔 Session status changed:', data);

    // Determine the message based on status change
    let message = '';
    if (newStatus === 'confirmed') {
      message = `${supporterName} has accepted your session request`;
    } else if (newStatus === 'cancelled') {
      message = `Your session has been cancelled${reason ? `: ${reason}` : ''}`;
    }

    // Add to global notifications
    addMessageNotification({
      id: sessionId,
      senderId: null,
      senderName: supporterName || 'System',
      message,
      isGroupMessage: false,
      groupId: null,
      groupName: null,
      timestamp: new Date(),
      type: 'session_status',
      sessionId,
      newStatus,
    });
  }, [addMessageNotification]);

  // Register listeners
  useEffect(() => {
    if (!socket) return;

    socket.on('session_booked', handleSessionBooked);
    socket.on('session_status_changed', handleSessionStatusChanged);

    console.log('📋 Session listeners registered:', {
      'session_booked': handleSessionBooked,
      'session_status_changed': handleSessionStatusChanged,
    });

    return () => {
      socket.off('session_booked', handleSessionBooked);
      socket.off('session_status_changed', handleSessionStatusChanged);
      console.log('📋 Session listeners unregistered');
    };
  }, [handleSessionBooked, handleSessionStatusChanged]);
};
