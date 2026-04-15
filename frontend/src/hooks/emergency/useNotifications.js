import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from '../../api/axios.config.js';
import toast from 'react-hot-toast';

/**
 * Hook for managing user notifications
 * @param {object} filters - Notification filters (type, limit, etc.)
 * @returns {object} Notifications list and mutations
 */
export const useNotifications = (filters = {}) => {
  const queryClient = useQueryClient();

  // Get notifications
  const { data: notificationsData, isLoading } = useQuery({
    queryKey: ['notifications', filters],
    queryFn: () => axios.get('/notifications', { params: filters }).then(res => res.data),
    onError: (error) => {
      console.error('Failed to load notifications:', error);
    },
  });

  const notifications = notificationsData?.data || [];

  // Mark as read
  const { mutate: markAsRead } = useMutation({
    mutationFn: (notificationId) => axios.patch(`/notifications/${notificationId}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Mark all as read
  const { mutate: markAllAsRead } = useMutation({
    mutationFn: () => axios.patch('/notifications/mark-all-read'),
    onSuccess: () => {
      toast.success('All notifications marked as read');
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to mark notifications');
    },
  });

  // Delete notification
  const { mutate: deleteNotification, isLoading: isDeletingNotification } = useMutation({
    mutationFn: (notificationId) => axios.delete(`/notifications/${notificationId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete notification');
    },
  });

  return {
    notifications,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    isDeletingNotification,
  };
};
