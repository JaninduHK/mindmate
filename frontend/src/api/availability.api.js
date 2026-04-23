import axios from 'axios';
import { getAccessToken } from './axios.config';

const API_BASE_URL = 'http://localhost:5000/api/availability';

/**
 * Get all availability slots for the logged-in peer supporter
 */
export const getMyAvailability = async (startDate = null, endDate = null) => {
  try {
    const config = {
      headers: {
        Authorization: `Bearer ${getAccessToken()}`,
      },
    };

    const params = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;

    const response = await axios.get(`${API_BASE_URL}/my-slots`, { params, ...config });
    return response.data;
  } catch (error) {
    console.error('Error fetching my availability:', error);
    throw error;
  }
};

/**
 * Add a new availability slot
 */
export const addAvailability = async (data) => {
  try {
    const config = {
      headers: {
        Authorization: `Bearer ${getAccessToken()}`,
        'Content-Type': 'application/json',
      },
    };

    // Format date to ISO string - handle both Date objects and strings
    let dateValue = data.date;
    if (dateValue instanceof Date) {
      dateValue = dateValue.toISOString().split('T')[0];
    } else if (typeof dateValue === 'string' && dateValue.length > 10) {
      // Already an ISO string, just get the date part
      dateValue = dateValue.split('T')[0];
    }

    const formattedData = {
      ...data,
      date: dateValue,
    };

    console.log('Sending availability data to backend:', formattedData);

    const response = await axios.post(API_BASE_URL, formattedData, config);
    return response.data;
  } catch (error) {
    console.error('Error adding availability:', error);
    throw error;
  }
};

/**
 * Get available slots for a specific peer supporter (for booking)
 */
export const getAvailabilityByCounselor = async (supporterId, startDate = null, endDate = null) => {
  try {
    const params = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;

    console.log(`🔍 Calling availability API:`, {
      url: `${API_BASE_URL}/counselor/${supporterId}`,
      params,
    });

    const response = await axios.get(`${API_BASE_URL}/counselor/${supporterId}`, { params });
    
    console.log(`✅ Availability API response:`, {
      success: response.data.success,
      dataLength: response.data.data?.length || 0,
      data: response.data.data,
    });
    
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching counselor availability:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Update an availability slot
 */
export const updateAvailability = async (availabilityId, data) => {
  try {
    const config = {
      headers: {
        Authorization: `Bearer ${getAccessToken()}`,
        'Content-Type': 'application/json',
      },
    };

    const response = await axios.put(`${API_BASE_URL}/${availabilityId}`, data, config);
    return response.data;
  } catch (error) {
    console.error('Error updating availability:', error);
    throw error;
  }
};

/**
 * Delete an availability slot
 */
export const deleteAvailability = async (availabilityId) => {
  try {
    const config = {
      headers: {
        Authorization: `Bearer ${getAccessToken()}`,
      },
    };

    const response = await axios.delete(`${API_BASE_URL}/${availabilityId}`, config);
    return response.data;
  } catch (error) {
    console.error('Error deleting availability:', error);
    throw error;
  }
};

/**
 * Get available counselors for a specific date
 */
export const getAvailableCounselors = async (date) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/available-counselors`, {
      params: { date },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching available counselors:', error);
    throw error;
  }
};

/**
 * Check if a specific time slot is available
 */
export const checkAvailability = async (supporterId, date, startTime, endTime) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/check`, {
      params: { supporterId, date, startTime, endTime },
    });
    return response.data;
  } catch (error) {
    console.error('Error checking availability:', error);
    throw error;
  }
};

/**
 * Get availability statistics
 */
export const getAvailabilityStats = async () => {
  try {
    const config = {
      headers: {
        Authorization: `Bearer ${getAccessToken()}`,
      },
    };

    const response = await axios.get(`${API_BASE_URL}/stats`, config);
    return response.data;
  } catch (error) {
    console.error('Error fetching availability stats:', error);
    throw error;
  }
};
