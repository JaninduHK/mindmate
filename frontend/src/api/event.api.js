import axiosInstance from './axios.config';

export const eventAPI = {
  list: (params) => axiosInstance.get('/events', { params }).then((r) => r.data),
  getById: (id) => axiosInstance.get(`/events/${id}`).then((r) => r.data),
  create: (data) => axiosInstance.post('/events', data).then((r) => r.data),
  update: (id, data) => axiosInstance.put(`/events/${id}`, data).then((r) => r.data),
  delete: (id) => axiosInstance.delete(`/events/${id}`).then((r) => r.data),
  getMyCounselorEvents: (params) =>
    axiosInstance.get('/events/counselor/me', { params }).then((r) => r.data),
};
