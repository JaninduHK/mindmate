import axiosInstance from './axios.config';

export const adminAPI = {
  listUsers: (params) => axiosInstance.get('/admin/users', { params }).then((r) => r.data),
  listCounselors: (params) => axiosInstance.get('/admin/counselors', { params }).then((r) => r.data),
  toggleCounselorStatus: (id, data) =>
    axiosInstance.put(`/admin/counselors/${id}/verify`, data).then((r) => r.data),
  listEvents: (params) => axiosInstance.get('/admin/events', { params }).then((r) => r.data),
  updateEventStatus: (id, data) =>
    axiosInstance.put(`/admin/events/${id}/status`, data).then((r) => r.data),
  listBookings: (params) => axiosInstance.get('/admin/bookings', { params }).then((r) => r.data),
  confirmBankTransfer: (id) => axiosInstance.post(`/admin/bookings/${id}/confirm-bank-transfer`).then((r) => r.data),
  rejectBankTransfer: (id, data) => axiosInstance.post(`/admin/bookings/${id}/reject-bank-transfer`, data).then((r) => r.data),
  getEarnings: () => axiosInstance.get('/admin/earnings').then((r) => r.data),
  getConfig: () => axiosInstance.get('/admin/config').then((r) => r.data),
  updateConfig: (data) => axiosInstance.put('/admin/config', data).then((r) => r.data),
};
