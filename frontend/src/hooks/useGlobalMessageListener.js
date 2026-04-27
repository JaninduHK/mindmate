import { useEffect } from 'react';
import { socket } from '../socket/socket';
import { useNotification } from './useNotification';
import { useAuth } from './useAuth';

export const useGlobalMessageListener = () => {
  const { user } = useAuth();
  const { addMessageNotification } = useNotification();

  useEffect(() => {
    if (!user?._id) return;

    // Join user's personal room for real-time messages
    const joinRoom = () => {
      socket.emit('join_room', user._id);
      console.log('✅ [Global] User joined socket room:', user._id, '| Socket ID:', socket.id);
    };

    // Join room initially and on every reconnect
    joinRoom();
    socket.on('connect', joinRoom);

    // Listen for incoming messages from any chat
    const handleReceiveMessage = (data) => {
      console.log('[Global] Received message:', data);
      if (data.senderId !== user._id) {
        addMessageNotification({
          senderId: data.senderId,
          senderName: data.senderName || 'Unknown User',
          message: data.message,
          recipientId: data.senderId,
          timestamp: new Date(),
        });
      }
    };

    // Listen for incoming group messages
    const handleReceiveGroupMessage = (data) => {
      console.log('[Global] Received group message:', data);
      if (data.senderId !== user._id) {
        addMessageNotification({
          senderId: data.senderId,
          senderName: data.senderName || 'Unknown User',
          message: data.message,
          groupId: data.groupId,
          groupName: data.groupName,
          isGroupMessage: true,
          timestamp: new Date(),
        });
      }
    };

    socket.on('receive_message', handleReceiveMessage);
    socket.on('receive_group_message', handleReceiveGroupMessage);

    return () => {
      socket.off('connect', joinRoom);
      socket.off('receive_message', handleReceiveMessage);
      socket.off('receive_group_message', handleReceiveGroupMessage);
    };
  }, [user?._id, addMessageNotification]);
};
