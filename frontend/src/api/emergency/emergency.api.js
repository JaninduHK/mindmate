import axios from '../axios.config.js';

export const emergencyAPI = {
  getStatus: () => axios.get('/emergency/status'),
  
  activate: (locationData) => axios.post('/emergency/activate', locationData),
  
  deactivate: () => axios.post('/emergency/deactivate'),
  
  acknowledge: () => axios.post('/emergency/acknowledge'),
};
