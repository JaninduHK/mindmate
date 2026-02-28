import axiosInstance from './axios.config';

export const notificationAPI = {
  getAll: (params) => axiosInstance.get('/notifications', { params }).then((r) => r.data),
  markAsRead: (id) => axiosInstance.put(`/notifications/${id}/read`).then((r) => r.data),
  markAllAsRead: () => axiosInstance.put('/notifications/read-all').then((r) => r.data),
};
