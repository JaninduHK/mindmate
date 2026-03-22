import axiosInstance from './axios.config';

export const reviewAPI = {
  create: (data) => axiosInstance.post('/reviews', data).then((r) => r.data),
  getMy: () => axiosInstance.get('/reviews/my').then((r) => r.data),
  getForEvent: (eventId, params) =>
    axiosInstance.get(`/reviews/event/${eventId}`, { params }).then((r) => r.data),
  getForCounselor: (counselorId, params) =>
    axiosInstance.get(`/reviews/counselor/${counselorId}`, { params }).then((r) => r.data),
  delete: (id) => axiosInstance.delete(`/reviews/${id}`).then((r) => r.data),
};
