import axiosInstance from './axios.config.js';

export const guardianApi = {
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

  // NEW: Get guardian dashboard data for a specific user
  getUserDashboard: async (userId) => {
    try {
      const response = await axiosInstance.get(`/guardian/dashboard/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching guardian dashboard:', error);
      throw error;
    }
  },

  // NEW: Get all high-risk alerts for guardian's monitored users
  getHighRiskAlerts: async () => {
    try {
      const response = await axiosInstance.get('/guardian/alerts/high-risk');
      return response.data;
    } catch (error) {
      console.error('Error fetching high-risk alerts:', error);
      throw error;
    }
  },

  // NEW: Get user mood history
  getUserMoodHistory: async (userId, params = {}) => {
    try {
      const response = await axiosInstance.get(`/guardian/${userId}/moods`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching mood history:', error);
      throw error;
    }
  },

  // NEW: Get user's goals
  getUserGoals: async (userId) => {
    try {
      const response = await axiosInstance.get(`/guardian/${userId}/goals`);
      return response.data;
    } catch (error) {
      console.error('Error fetching user goals:', error);
      throw error;
    }
  },

  // NEW: Mark risk alert as acknowledged
  acknowledgeRiskAlert: async (alertId) => {
    try {
      const response = await axiosInstance.post(`/guardian/alerts/${alertId}/acknowledge`);
      return response.data;
    } catch (error) {
      console.error('Error acknowledging alert:', error);
      throw error;
    }
  },

  // NEW: Contact a user (sends notification)
  contactUser: async (userId, message) => {
    try {
      const response = await axiosInstance.post(`/guardian/${userId}/contact`, { message });
      return response.data;
    } catch (error) {
      console.error('Error contacting user:', error);
      throw error;
    }
  },

  // NEW: Get recommended content for a user based on their risk level and mood
  getRecommendedContent: async (userId) => {
    try {
      const response = await axiosInstance.get(`/guardian/${userId}/recommended-content`);
      return response.data;
    } catch (error) {
      console.error('Error fetching recommended content:', error);
      throw error;
    }
  },

  // NEW: Get all monitored users for the current guardian
  getMonitoredUsers: async () => {
    try {
      const response = await axiosInstance.get('/guardian/monitored-users');
      return response.data;
    } catch (error) {
      console.error('Error fetching monitored users:', error);
      throw error;
    }
  },

  // NEW: Get mood analytics for a user
  getMoodAnalytics: async (userId) => {
    try {
      const response = await axiosInstance.get(`/guardian/${userId}/moods/analytics`);
      return response.data;
    } catch (error) {
      console.error('Error fetching mood analytics:', error);
      throw error;
    }
  },

  // NEW: Get mood alerts/warnings for a user
  getMoodAlerts: async (userId) => {
    try {
      const response = await axiosInstance.get(`/guardian/${userId}/moods/alerts`);
      return response.data;
    } catch (error) {
      console.error('Error fetching mood alerts:', error);
      throw error;
    }
  },

  // NEW: Get goal analytics for a user
  getGoalAnalytics: async (userId) => {
    try {
      const response = await axiosInstance.get(`/guardian/${userId}/goals/analytics`);
      return response.data;
    } catch (error) {
      console.error('Error fetching goal analytics:', error);
      throw error;
    }
  },

  // NEW: Get daily analytics for a user
  getDailyAnalytics: async (userId) => {
    try {
      const response = await axiosInstance.get(`/guardian/${userId}/daily-analytics`);
      return response.data;
    } catch (error) {
      console.error('Error fetching daily analytics:', error);
      throw error;
    }
  },

  // NEW: Get analytics summary for a user
  getAnalyticsSummary: async (userId) => {
    try {
      const response = await axiosInstance.get(`/guardian/${userId}/analytics/summary`);
      return response.data;
    } catch (error) {
      console.error('Error fetching analytics summary:', error);
      throw error;
    }
  },
};

// Export as both named and default for compatibility
export const guardianAPI = guardianApi;
export default guardianApi;
