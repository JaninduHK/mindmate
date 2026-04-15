import axios from '../axios.config.js';

export const contactsAPI = {
  getContacts: () => axios.get('/emergency-contacts'),
  
  getContact: (id) => axios.get(`/emergency-contacts/${id}`),
  
  addContact: (contactData) => axios.post('/emergency-contacts', contactData),
  
  updateContact: (id, contactData) => axios.put(`/emergency-contacts/${id}`, contactData),
  
  deleteContact: (id) => axios.delete(`/emergency-contacts/${id}`),
  
  resendInvite: (id) => axios.post(`/emergency-contacts/${id}/resend-invite`),
};
