import axiosInstance from './axios.config';

export const peerSupporterAPI = {
  list: (params) => axiosInstance.get('/peer-supporters', { params }).then((r) => r.data),
  getById: (id) => axiosInstance.get(`/peer-supporters/${id}`).then((r) => r.data),
};
