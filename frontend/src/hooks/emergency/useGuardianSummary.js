import { useQuery } from '@tanstack/react-query';
import { guardianAPI } from '../../api/emergency/guardian.api.js';

/**
 * Hook for getting list of linked users for guardian
 * @returns {object} Linked users list and loading state
 */
export const useGuardianLinkedUsers = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['guardianLinkedUsers'],
    queryFn: () => guardianAPI.getLinkedUsers().then(res => res.data),
    staleTime: 5 * 60 * 1000, // 5 minutes
    onError: (error) => {
      console.error('Failed to fetch linked users:', error);
    },
  });

  return {
    data: data?.data || [],
    isLoading,
    error,
  };
};

/**
 * Hook for getting summary of a specific user
 * @param {string} userId - The user ID to get summary for
 * @param {object} options - React Query options
 * @returns {object} User summary data and loading state
 */
export const useGuardianSummary = (userId, options = {}) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['guardianSummary', userId],
    queryFn: () => guardianAPI.getUserSummary(userId).then(res => res.data),
    staleTime: 60000, // 1 minute
    enabled: !!userId,
    ...options,
    onError: (error) => {
      console.error('Failed to fetch user summary:', error);
    },
  });

  return {
    data: data?.data,
    isLoading,
    error,
  };
};

/**
 * Hook for getting notifications of a linked user
 * @param {string} userId - The user ID
 * @param {object} filters - Notification filters
 * @param {object} options - React Query options
 * @returns {object} Notifications list and loading state
 */
export const useGuardianNotifications = (userId, filters = {}, options = {}) => {
  const { data, isLoading, error } = useQuery(
    ['guardianNotifications', userId, filters],
    () => guardianAPI.getUserNotifications(userId, filters).then(res => res.data),
    {
      staleTime: 30000, // 30 seconds
      enabled: !!userId,
      ...options,
      onError: (error) => {
        console.error('Failed to fetch user notifications:', error);
      },
    }
  );

  return {
    data: data?.data || [],
    isLoading,
    error,
  };
};

/**
 * Hook for getting emergency contacts of a linked user
 * @param {string} userId - The user ID
 * @returns {object} Emergency contacts and loading state
 */
export const useGuardianEmergencyContacts = (userId) => {
  const { data, isLoading, error } = useQuery(
    ['guardianEmergencyContacts', userId],
    () => guardianAPI.getUserEmergencyContacts(userId).then(res => res.data),
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      enabled: !!userId,
      onError: (error) => {
        console.error('Failed to fetch emergency contacts:', error);
      },
    }
  );

  return {
    data: data?.data || [],
    isLoading,
    error,
  };
};
