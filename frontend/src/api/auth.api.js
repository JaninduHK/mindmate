import axiosInstance from './axios.config.js';

export const authAPI = {
  // Register new user (supports initialEmergencyContact)
  register: async (userData) => {
    const response = await axiosInstance.post('/auth/register', userData);
    return response.data;
  },

  // Register peer supporter
  registerPeerSupporter: async (userData) => {
    const response = await axiosInstance.post('/auth/register/peer-supporter', userData);
    return response.data;
  },

  // Login user
  login: async (credentials) => {
    const response = await axiosInstance.post('/auth/login', credentials);
    return response.data;
  },

  // Logout user
  logout: async () => {
    const response = await axiosInstance.post('/auth/logout');
    return response.data;
  },

  // Get current user
  getCurrentUser: async () => {
    const response = await axiosInstance.get('/auth/me');
    return response.data;
  },

  // Refresh access token
  refreshToken: async () => {
    const response = await axiosInstance.post('/auth/refresh');
    return response.data;
  },

  // Validate invitation token (for emergency contact)
  validateInvitationToken: async (token) => {
    const response = await axiosInstance.get(`/invitations/${token}/validate`);
    return response.data;
  },

  // Accept invitation and create account (for emergency contact)
  acceptInvitationNewAccount: async (token, userData) => {
    const response = await axiosInstance.post(`/invitations/${token}/accept-register`, userData);
    return response.data;
  },

  // Accept invitation with existing account (for emergency contact)
  acceptInvitationExistingAccount: async (token) => {
    const response = await axiosInstance.post(`/invitations/${token}/accept-existing-account`);
    return response.data;
  },
};

