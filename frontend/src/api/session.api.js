import axiosInstance from './axios.config';

export const bookSession = async (data) => {
  try {
    const formattedData = {
      ...data,
      sessionDate: new Date(data.sessionDate).toISOString().split('T')[0],
    };

    const response = await axiosInstance.post('/sessions/book', formattedData);
    return response.data;
  } catch (error) {
    console.error('Error booking session:', error);
    throw error;
  }
};

export const getUserSessions = async () => {
  try {
    const response = await axiosInstance.get('/sessions/my');
    return response.data;
  } catch (error) {
    console.error('Error fetching user sessions:', error);
    throw error;
  }
};

export const getSupporterBookings = async () => {
  try {
    const response = await axiosInstance.get('/sessions/peer-supporter/bookings');
    return response.data;
  } catch (error) {
    console.error('Error fetching supporter bookings:', error);
    throw error;
  }
};

export const getAvailableSlots = async (supporterId, date) => {
  try {
    const response = await axiosInstance.get('/sessions/available-slots', {
      params: { supporterId, date },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching available slots:', error);
    throw error;
  }
};

export const getSessionDetails = async (sessionId) => {
  try {
    const response = await axiosInstance.get(`/sessions/${sessionId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching session details:', error);
    throw error;
  }
};

export const cancelSession = async (sessionId, reason = '') => {
  try {
    const response = await axiosInstance.post(`/sessions/${sessionId}/cancel`, { reason });
    return response.data;
  } catch (error) {
    console.error('Error canceling session:', error);
    throw error;
  }
};

export const acceptSession = async (sessionId) => {
  try {
    const response = await axiosInstance.post(`/sessions/${sessionId}/accept`, {});
    return response.data;
  } catch (error) {
    console.error('Error accepting session:', error);
    throw error;
  }
};

export const addSessionFeedback = async (sessionId, feedbackData) => {
  try {
    const response = await axiosInstance.post(`/sessions/${sessionId}/feedback`, feedbackData);
    return response.data;
  } catch (error) {
    console.error('Error adding session feedback:', error);
    throw error;
  }
};

export const updateSessionDetails = async (sessionId, details) => {
  try {
    const response = await axiosInstance.put(`/sessions/${sessionId}/details`, details);
    return response.data;
  } catch (error) {
    console.error('Error updating session details:', error);
    throw error;
  }
};
