import { axiosInstance } from './axios.config.js';

export const peerSessionAPI = {
  book: (data) => axiosInstance.post('/peer-sessions', data).then((r) => r.data),
  getMy: (params) => axiosInstance.get('/peer-sessions/my', { params }).then((r) => r.data),
  getCounselor: (params) => axiosInstance.get('/peer-sessions/counselor', { params }).then((r) => r.data),
  updateStatus: (id, data) => axiosInstance.patch(`/peer-sessions/${id}/status`, data).then((r) => r.data),
};
