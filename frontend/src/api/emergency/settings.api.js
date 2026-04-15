import axios from '../axios.config.js';

export const settingsAPI = {
  getPreferences: () => axios.get('/settings/preferences'),
  
  updatePreferences: (preferences) => axios.put('/settings/preferences', preferences),
  
  getConfig: () => axios.get('/settings/config'),
};
