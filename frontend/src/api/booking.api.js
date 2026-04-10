import axiosInstance from './axios.config';

export const bookingAPI = {
  create: (data) => axiosInstance.post('/bookings', data).then((r) => r.data),
  getMy: (params) => axiosInstance.get('/bookings/my', { params }).then((r) => r.data),
  getCounselorBookings: (params) => axiosInstance.get('/bookings/counselor', { params }).then((r) => r.data),
  getById: (id) => axiosInstance.get(`/bookings/${id}`).then((r) => r.data),
  cancel: (id, data) => axiosInstance.post(`/bookings/${id}/cancel`, data).then((r) => r.data),
  uploadSlip: (id, file) => {
    const form = new FormData();
    form.append('slip', file);
    return axiosInstance.post(`/bookings/${id}/upload-slip`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data);
  },
};
