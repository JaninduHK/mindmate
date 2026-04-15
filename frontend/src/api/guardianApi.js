import axiosInstance from './axios.config.js';

export const guardianAPI = {
  // Get all users this guardian is monitoring with their status
  getUsersStatus: async () => {
    const response = await axiosInstance.get('/guardian/users-status');
    return response.data;
  },

  // Get detailed status for a specific user
  getUserDetail: async (userId) => {
    const response = await axiosInstance.get(`/guardian/users/${userId}`);
    return response.data;
  },

  // Get all linked users (for emergency contact/guardian)
  getLinkedUsers: async () => {
    const response = await axiosInstance.get('/guardian/users-status');
    return response.data;
  },

  // Get summary for a linked user (alias)
  getUserSummary: async (userId) => {
    const response = await axiosInstance.get(`/guardian/users/${userId}`);
    return response.data;
  },

  // Get notifications for a linked user
  getUserNotifications: async (userId, params = {}) => {
    const response = await axiosInstance.get(`/guardian/users/${userId}/notifications`, { params });
    return response.data;
  },

  // Get emergency contacts for a linked user (guardian view)
  getUserEmergencyContacts: async (userId) => {
    const response = await axiosInstance.get(`/guardian/users/${userId}/emergency-contacts`);
    return response.data;
  },

  // Acknowledge emergency for a linked user
  acknowledgeEmergency: async (userId) => {
    const response = await axiosInstance.post(`/guardian/users/${userId}/acknowledge`);
    return response.data;
  },
};
