import axios from '../axios.config.js';

export const contentAPI = {
  getContent: (filters) => axios.get('/content', { params: filters }),
  
  getRecommendations: () => axios.get('/content/recommendations'),
  
  getSearchLinks: (contentType) => axios.get('/content/search-links', { params: { type: contentType } }),
  
  rateContent: (contentId, rating) => axios.post(`/content/${contentId}/rate`, { rating }),
};
