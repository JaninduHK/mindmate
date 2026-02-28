import axiosInstance from './axios.config';

export const paymentAPI = {
  getConnectOnboardingUrl: () =>
    axiosInstance.get('/payments/connect/onboard').then((r) => r.data),
  getConnectStatus: () => axiosInstance.get('/payments/connect/status').then((r) => r.data),
};
