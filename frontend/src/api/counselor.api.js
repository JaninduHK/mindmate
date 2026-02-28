import axiosInstance from './axios.config';

export const counselorAPI = {
  onboard: (data) => axiosInstance.post('/counselors/onboard', data).then((r) => r.data),
  getMyProfile: () => axiosInstance.get('/counselors/profile/me').then((r) => r.data),
  updateMyProfile: (data) => axiosInstance.put('/counselors/profile/me', data).then((r) => r.data),
  list: (params) => axiosInstance.get('/counselors', { params }).then((r) => r.data),
  getById: (id) => axiosInstance.get(`/counselors/${id}`).then((r) => r.data),
};
