import axiosInstance from './axios.config.js';

export const notificationAPI = {
  // Get all notifications
  getAll: (params) => axiosInstance.get('/notifications', { params }).then((r) => r.data),
  
  // Mark single notification as read
  markAsRead: (id) => axiosInstance.patch(`/notifications/${id}/read`).then((r) => r.data),
  
  // Mark all notifications as read
  markAllAsRead: () => axiosInstance.patch('/notifications/read-all').then((r) => r.data),
  
  // Delete notification
  delete: (id) => axiosInstance.delete(`/notifications/${id}`).then((r) => r.data),
  
  // Get notifications by type (for crisis system)
  getByType: (type, params = {}) => 
    axiosInstance.get('/notifications', { params: { ...params, type } }).then((r) => r.data),
};
