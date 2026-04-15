import { createContext, useState, useEffect, useCallback, useContext } from 'react';
import { useEmergencyMode } from '../hooks/emergency/useEmergencyMode.js';

export const EmergencyContext = createContext();

export const EmergencyProvider = ({ children }) => {
  const {
    isEmergencyActive,
    emergencyStatus,
    activateEmergency,
    deactivateEmergency,
    location,
    refetchStatus,
  } = useEmergencyMode();

  const [showBanner, setShowBanner] = useState(false);
  const [mostRecentActivation, setMostRecentActivation] = useState(null);

  // Update banner visibility based on emergency status
  useEffect(() => {
    setShowBanner(isEmergencyActive);
    if (isEmergencyActive) {
      setMostRecentActivation(emergencyStatus);
    }
  }, [isEmergencyActive, emergencyStatus]);

  // Auto-refresh emergency status every 30 seconds when active
  useEffect(() => {
    if (!isEmergencyActive) return;

    const interval = setInterval(() => {
      refetchStatus();
    }, 30000);

    return () => clearInterval(interval);
  }, [isEmergencyActive, refetchStatus]);

  const handleDeactivateEmergency = useCallback(() => {
    deactivateEmergency('');
  }, [deactivateEmergency]);

  const value = {
    isEmergencyActive,
    emergencyStatus,
    showBanner,
    setShowBanner,
    activateEmergency,
    deactivateEmergency: handleDeactivateEmergency,
    location,
    refetchStatus,
    mostRecentActivation,
  };

  return (
    <EmergencyContext.Provider value={value}>
      {children}
    </EmergencyContext.Provider>
  );
};

export const useEmergency = () => {
  const context = useContext(EmergencyContext);
  if (!context) {
    throw new Error('useEmergency must be used within EmergencyProvider');
  }
  return context;
};
