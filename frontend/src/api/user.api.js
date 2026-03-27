import axiosInstance from './axios.config.js';

export const userAPI = {
  // Get user profile
  getProfile: async () => {
    const response = await axiosInstance.get('/user/profile');
    return response.data;
  },

  // Update user profile
  updateProfile: async (userData) => {
    const response = await axiosInstance.put('/user/profile', userData);
    return response.data;
  },

  // Change password
  changePassword: async (passwordData) => {
    const response = await axiosInstance.put('/user/password', passwordData);
    return response.data;
  },

  // Delete account
  deleteAccount: async () => {
    const response = await axiosInstance.delete('/user/account');
    return response.data;
  },

  // Get all users (for peer supporters to help)
  getUsers: async (params) => {
    const response = await axiosInstance.get('/user/help/users', { params });
    return response.data;
  },

  // Toggle peer counselor availability
  toggleAvailability: async () => {
    const response = await axiosInstance.put('/user/availability/toggle');
    return response.data;
  },

  // Get peer counselor availability status
  getAvailabilityStatus: async (peerId) => {
    const response = await axiosInstance.get(`/user/availability/status/${peerId}`);
    return response.data;
  },
};
