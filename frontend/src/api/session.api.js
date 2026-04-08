import axios from 'axios';
import { getAccessToken } from './axios.config';

const API_BASE_URL = 'http://localhost:5001/api/sessions';

/**
 * Book a new session with a peer counselor
 */
export const bookSession = async (data) => {
  try {
    const config = {
      headers: {
        Authorization: `Bearer ${getAccessToken()}`,
        'Content-Type': 'application/json',
      },
    };

    // Format date to ISO string
    const formattedData = {
      ...data,
      sessionDate: new Date(data.sessionDate).toISOString().split('T')[0],
    };

    const response = await axios.post(`${API_BASE_URL}/book`, formattedData, config);
    return response.data;
  } catch (error) {
    console.error('Error booking session:', error);
    throw error;
  }
};

/**
 * Get user's booked sessions
 */
export const getUserSessions = async () => {
  try {
    const config = {
      headers: {
        Authorization: `Bearer ${getAccessToken()}`,
      },
    };

    const response = await axios.get(`${API_BASE_URL}/my`, config);
    return response.data;
  } catch (error) {
    console.error('Error fetching user sessions:', error);
    throw error;
  }
};

/**
 * Get peer supporter's bookings
 */
export const getSupporterBookings = async () => {
  try {
    const config = {
      headers: {
        Authorization: `Bearer ${getAccessToken()}`,
      },
    };

    const response = await axios.get(`${API_BASE_URL}/peer-supporter/bookings`, config);
    return response.data;
  } catch (error) {
    console.error('Error fetching supporter bookings:', error);
    throw error;
  }
};

/**
 * Get available slots for a peer counselor on a specific date
 */
export const getAvailableSlots = async (supporterId, date) => {
  try {
    const config = {
      headers: {
        Authorization: `Bearer ${getAccessToken()}`,
      },
    };

    const response = await axios.get(`${API_BASE_URL}/available-slots`, {
      params: {
        supporterId,
        date,
      },
      ...config,
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching available slots:', error);
    throw error;
  }
};

/**
 * Get session details
 */
export const getSessionDetails = async (sessionId) => {
  try {
    const config = {
      headers: {
        Authorization: `Bearer ${getAccessToken()}`,
      },
    };

    const response = await axios.get(`${API_BASE_URL}/${sessionId}`, config);
    return response.data;
  } catch (error) {
    console.error('Error fetching session details:', error);
    throw error;
  }
};

/**
 * Cancel a session
 */
export const cancelSession = async (sessionId) => {
  try {
    const config = {
      headers: {
        Authorization: `Bearer ${getAccessToken()}`,
      },
    };

    const response = await axios.post(`${API_BASE_URL}/${sessionId}/cancel`, {}, config);
    return response.data;
  } catch (error) {
    console.error('Error canceling session:', error);
    throw error;
  }
};

/**
 * Add feedback to a session
 */
export const addSessionFeedback = async (sessionId, feedbackData) => {
  try {
    const config = {
      headers: {
        Authorization: `Bearer ${getAccessToken()}`,
        'Content-Type': 'application/json',
      },
    };

    const response = await axios.post(`${API_BASE_URL}/${sessionId}/feedback`, feedbackData, config);
    return response.data;
  } catch (error) {
    console.error('Error adding session feedback:', error);
    throw error;
  }
};

/**
 * Update session details
 */
export const updateSessionDetails = async (sessionId, details) => {
  try {
    const config = {
      headers: {
        Authorization: `Bearer ${getAccessToken()}`,
        'Content-Type': 'application/json',
      },
    };

    const response = await axios.put(`${API_BASE_URL}/${sessionId}/details`, details, config);
    return response.data;
  } catch (error) {
    console.error('Error updating session details:', error);
    throw error;
  }
};
