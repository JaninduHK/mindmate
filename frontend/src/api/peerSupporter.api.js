import axiosInstance from './axios.config';

export const peerSupporterAPI = {
  list: async (params) => {
    // Add timestamp to bust cache
    const response = await axiosInstance.get('/peer-supporters', { 
      params: { ...params, _t: Date.now() } 
    });
    return response.data;
  },
  getById: async (id) => {
    const response = await axiosInstance.get(`/peer-supporters/${id}`, {
      params: { _t: Date.now() }
    });
    return response.data;
  },
};
