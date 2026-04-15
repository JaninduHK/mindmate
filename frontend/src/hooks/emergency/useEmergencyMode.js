import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { emergencyAPI } from '../../api/emergency/emergency.api.js';
import toast from 'react-hot-toast';

/**
 * Hook for managing emergency activation/deactivation status and operations
 * @returns {object} Emergency mode status, mutations, and helper functions
 */
export const useEmergencyMode = () => {
  const queryClient = useQueryClient();

  // Get emergency status
  const { data: emergencyStatus, isLoading: statusLoading, refetch: refetchStatus } = useQuery({
    queryKey: ['emergencyStatus'],
    queryFn: () => emergencyAPI.getStatus().then(res => res.data),
    staleTime: 30000, // 30 seconds
    onError: (error) => {
      console.error('Failed to fetch emergency status:', error);
    },
  });

  const isEmergencyActive = emergencyStatus?.isActive || false;
  const selectedContacts = emergencyStatus?.selectedContacts || [];

  // Activate emergency
  const { mutate: activateMutation, isLoading: isActivating } = useMutation({
    mutationFn: (locationData) => emergencyAPI.activate(locationData),
    onSuccess: (response) => {
      toast.success('Emergency contacts have been notified!');
      queryClient.invalidateQueries({ queryKey: ['emergencyStatus'] });
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to activate emergency mode';
      toast.error(message);
    },
  });

  // Deactivate emergency
  const { mutate: deactivateMutation, isLoading: isDeactivating } = useMutation({
    mutationFn: () => emergencyAPI.deactivate(),
    onSuccess: () => {
      toast.success('Emergency mode deactivated');
      queryClient.invalidateQueries({ queryKey: ['emergencyStatus'] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to deactivate emergency mode');
    },
  });

  // Acknowledge emergency
  const { mutate: acknowledgeMutation } = useMutation({
    mutationFn: () => emergencyAPI.acknowledge(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emergencyStatus'] });
    },
  });

  // Request geolocation
  const requestGeolocation = async () => {
    return new Promise((resolve) => {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
            });
          },
          (error) => {
            console.warn('Geolocation request denied or failed:', error);
            resolve(null); // Return null if geolocation fails
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
          }
        );
      } else {
        resolve(null);
      }
    });
  };

  // Handle activate with geolocation
  const activateEmergency = async (contactIds) => {
    const locationData = await requestGeolocation();
    activateMutation({
      selectedContacts: contactIds,
      location: locationData,
    });
  };

  const deactivateEmergency = () => {
    deactivateMutation();
  };

  return {
    isEmergencyActive,
    emergencyStatus,
    statusLoading,
    location: emergencyStatus?.location,
    selectedContacts,
    setSelectedContacts: (contacts) => {
      // This would be managed by parent component
    },
    activateEmergency,
    deactivateEmergency,
    acknowledgeEmergency: acknowledgeMutation,
    isActivating,
    isDeactivating,
    refetchStatus,
  };
};
