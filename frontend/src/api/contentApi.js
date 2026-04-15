import axiosInstance from './axios.config.js';

export const contentAPI = {
  // Get all content with filters
  getContent: async (filters = {}) => {
    const response = await axiosInstance.get('/content', { params: filters });
    return response.data;
  },

  // Get recommended content for user
  getRecommendations: async () => {
    const response = await axiosInstance.get('/content/recommendations');
    return response.data;
  },

  // Get search links (safe external URLs)
  getSearchLinks: async (query, source = 'general') => {
    const response = await axiosInstance.get('/content/search-links', {
      params: { query, source }
    });
    return response.data;
  },

  // Rate content (optional)
  rateContent: async (contentId, rating) => {
    const response = await axiosInstance.post(`/content/${contentId}/rate`, { rating });
    return response.data;
  },
};
