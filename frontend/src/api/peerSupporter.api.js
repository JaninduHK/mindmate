import { axiosInstance } from './axios.config.js';

export const peerSupporterAPI = {
  list: async (params) => {
    const response = await axiosInstance.get('/peer-supporters', { 
      params
    });
    return response.data;
  },
  getById: async (id) => {
    const response = await axiosInstance.get(`/peer-supporters/${id}`);
    return response.data;
  },
  bookSession: async (data) => {
    const response = await axiosInstance.post('/sessions/book', data);
    return response.data;
  },
};
