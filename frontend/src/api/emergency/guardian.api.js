import axios from '../axios.config.js';

export const guardianAPI = {
  getLinkedUsers: () => axios.get('/guardian/linked-users'),
  
  getUserSummary: (userId) => axios.get(`/guardian/users/${userId}/summary`),
  
  getUserNotifications: (userId, filters) => axios.get(`/guardian/users/${userId}/notifications`, { params: filters }),
  
  getUserEmergencyContacts: (userId) => axios.get(`/guardian/users/${userId}/emergency-contacts`),
  
  acknowledgeEmergency: (userId) => axios.post(`/guardian/users/${userId}/acknowledge-emergency`),
  
  getGuardianConfig: () => axios.get('/guardian/config'),
};
