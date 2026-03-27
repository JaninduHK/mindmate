import { axiosInstance } from './axios.config.js';

export const chatAPI = {
  // Get message history between two users
  getMessageHistory: async (userId, recipientId) => {
    try {
      const response = await axiosInstance.get('/chats/history', {
        params: { userId, recipientId },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching message history:', error);
      throw error;
    }
  },

  // Get conversations list
  getConversations: async (userId) => {
    try {
      const response = await axiosInstance.get('/chats/conversations', {
        params: { userId },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching conversations:', error);
      throw error;
    }
  },

  // Send message
  sendMessage: async (senderId, recipientId, message) => {
    try {
      const response = await axiosInstance.post('/chats/send', {
        senderId,
        recipientId,
        message,
      });
      return response.data;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  },

  // Edit message
  editMessage: async (messageId, newMessage, userId) => {
    try {
      const response = await axiosInstance.put('/chats/edit', {
        messageId,
        newMessage,
        userId,
      });
      return response.data;
    } catch (error) {
      console.error('Error editing message:', error);
      throw error;
    }
  },

  // Delete message
  deleteMessage: async (messageId, userId) => {
    try {
      const response = await axiosInstance.delete('/chats/delete', {
        data: { messageId, userId },
      });
      return response.data;
    } catch (error) {
      console.error('Error deleting message:', error);
      throw error;
    }
  },

  // Mark message as read
  markMessageAsRead: async (messageId, userId) => {
    try {
      const response = await axiosInstance.put('/chats/mark-read', {
        messageId,
        userId,
      });
      return response.data;
    } catch (error) {
      console.error('Error marking message as read:', error);
      throw error;
    }
  },

  // Mark conversation as read
  markConversationAsRead: async (userId, senderId) => {
    try {
      const response = await axiosInstance.put('/chats/mark-conversation-read', {
        userId,
        senderId,
      });
      return response.data;
    } catch (error) {
      console.error('Error marking conversation as read:', error);
      throw error;
    }
  },

  // Search messages
  searchMessages: async (userId, recipientId, keyword) => {
    try {
      const response = await axiosInstance.get('/chats/search', {
        params: { userId, recipientId, keyword },
      });
      return response.data;
    } catch (error) {
      console.error('Error searching messages:', error);
      throw error;
    }
  },
};

