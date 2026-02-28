import axiosInstance from './axios.config';

export const bookingAPI = {
  create: (data) => axiosInstance.post('/bookings', data).then((r) => r.data),
  getMy: (params) => axiosInstance.get('/bookings/my', { params }).then((r) => r.data),
  getById: (id) => axiosInstance.get(`/bookings/${id}`).then((r) => r.data),
  cancel: (id, data) => axiosInstance.post(`/bookings/${id}/cancel`, data).then((r) => r.data),
};
