import axiosInstance from './axios.config';

export const getMyAvailability = async (startDate = null, endDate = null) => {
  try {
    const params = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;

    const response = await axiosInstance.get('/availability/my-slots', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching my availability:', error);
    throw error;
  }
};

export const addAvailability = async (data) => {
  try {
    let dateValue = data.date;
    if (dateValue instanceof Date) {
      dateValue = dateValue.toISOString().split('T')[0];
    } else if (typeof dateValue === 'string' && dateValue.length > 10) {
      dateValue = dateValue.split('T')[0];
    }

    const formattedData = { ...data, date: dateValue };

    const response = await axiosInstance.post('/availability', formattedData);
    return response.data;
  } catch (error) {
    console.error('Error adding availability:', error);
    throw error;
  }
};

export const getAvailabilityByCounselor = async (supporterId, startDate = null, endDate = null) => {
  try {
    const params = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;

    const response = await axiosInstance.get(`/availability/counselor/${supporterId}`, { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching counselor availability:', error.response?.data || error.message);
    throw error;
  }
};

export const updateAvailability = async (availabilityId, data) => {
  try {
    const response = await axiosInstance.put(`/availability/${availabilityId}`, data);
    return response.data;
  } catch (error) {
    console.error('Error updating availability:', error);
    throw error;
  }
};

export const deleteAvailability = async (availabilityId) => {
  try {
    const response = await axiosInstance.delete(`/availability/${availabilityId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting availability:', error);
    throw error;
  }
};

export const getAvailableCounselors = async (date) => {
  try {
    const response = await axiosInstance.get('/availability/available-counselors', {
      params: { date },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching available counselors:', error);
    throw error;
  }
};

export const checkAvailability = async (supporterId, date, startTime, endTime) => {
  try {
    const response = await axiosInstance.get('/availability/check', {
      params: { supporterId, date, startTime, endTime },
    });
    return response.data;
  } catch (error) {
    console.error('Error checking availability:', error);
    throw error;
  }
};

export const getAvailabilityStats = async () => {
  try {
    const response = await axiosInstance.get('/availability/stats');
    return response.data;
  } catch (error) {
    console.error('Error fetching availability stats:', error);
    throw error;
  }
};
