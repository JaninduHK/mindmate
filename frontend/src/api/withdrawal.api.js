import axiosInstance from './axios.config';

export const withdrawalAPI = {
  getBalance: () => axiosInstance.get('/withdrawals/balance').then((r) => r.data),
  getMyWithdrawals: (params) =>
    axiosInstance.get('/withdrawals/my', { params }).then((r) => r.data),
  create: (data) => axiosInstance.post('/withdrawals', data).then((r) => r.data),

  // Admin
  listAll: (params) =>
    axiosInstance.get('/admin/withdrawals', { params }).then((r) => r.data),
  process: (id, data) =>
    axiosInstance.put(`/admin/withdrawals/${id}`, data).then((r) => r.data),
};
