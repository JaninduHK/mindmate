import axiosInstance from './axios.config.js';

export const settingsAPI = {
  // Get user preferences
  getPreferences: async () => {
    const response = await axiosInstance.get('/settings/preferences');
    return response.data;
  },

  // Update user preferences
  updatePreferences: async (preferences) => {
    const response = await axiosInstance.patch('/settings/preferences', preferences);
    return response.data;
  },

  // Get platform config (emergency numbers, etc.)
  getConfig: async () => {
    const response = await axiosInstance.get('/config');
    return response.data;
  },
};
