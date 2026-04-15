import axiosInstance from './axios.config.js';

export const contactsAPI = {
  // Get all emergency contacts for current user
  getContacts: async (filters = {}) => {
    const response = await axiosInstance.get('/emergency-contacts', { params: filters });
    return response.data;
  },

  // Get single emergency contact
  getContact: async (id) => {
    const response = await axiosInstance.get(`/emergency-contacts/${id}`);
    return response.data;
  },

  // Add new emergency contact
  addContact: async (contactData) => {
    const response = await axiosInstance.post('/emergency-contacts', contactData);
    return response.data;
  },

  // Update emergency contact
  updateContact: async (id, contactData) => {
    const response = await axiosInstance.put(`/emergency-contacts/${id}`, contactData);
    return response.data;
  },

  // Delete emergency contact
  deleteContact: async (id) => {
    const response = await axiosInstance.delete(`/emergency-contacts/${id}`);
    return response.data;
  },

  // Resend invitation to emergency contact
  resendInvite: async (id) => {
    const response = await axiosInstance.post(`/emergency-contacts/${id}/resend-invite`);
    return response.data;
  },

  // Get all monitored users (for guardians/emergency_contact role)
  getMonitoredUsers: async () => {
    const response = await axiosInstance.get('/emergency-contacts/guardian/monitored');
    return response.data;
  },
};
