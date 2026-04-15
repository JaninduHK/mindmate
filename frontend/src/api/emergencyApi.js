import axiosInstance from './axios.config.js';

export const emergencyAPI = {
  // Get emergency mode status
  getStatus: async () => {
    const response = await axiosInstance.get('/emergency/status');
    return response.data;
  },

  // Activate emergency mode
  activate: async (data = {}) => {
    const response = await axiosInstance.post('/emergency/activate', data);
    return response.data;
  },

  // Deactivate emergency mode
  deactivate: async (resolutionNote = '') => {
    const response = await axiosInstance.post('/emergency/deactivate', {
      resolutionNote
    });
    return response.data;
  },

  // Acknowledge emergency (for emergency contacts)
  acknowledge: async (sessionId) => {
    const response = await axiosInstance.post(`/emergency/${sessionId}/acknowledge`);
    return response.data;
  },
};
