import React, { createContext, useContext, useState, useEffect } from 'react'

const AppContext = createContext()

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: 'Mood Alert',
      message: 'Low mood detected',
      timestamp: new Date(),
      role: 'emergency_contact',
      severity: 'warning',
    },
    {
      id: 2,
      title: 'Goal Update',
      message: 'Exercise goal completed',
      timestamp: new Date(Date.now() - 86400000),
      role: 'user',
      severity: 'info',
    },
  ])
  const [isEmergencyActive, setIsEmergencyActive] = useState(false)

  // Initialize user from localStorage
  useEffect(() => {
    const savedUser = localStorage.getItem('user')
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser))
      } catch (error) {
        console.error('Error parsing user:', error)
      }
    }
  }, [])

  // Listen for emergency mode changes
  useEffect(() => {
    const checkEmergencyStatus = () => {
      const isActive = localStorage.getItem('emergencyModeActive') === 'true'
      setIsEmergencyActive(isActive)
    }

    checkEmergencyStatus()

    window.addEventListener('emergencyActivated', checkEmergencyStatus)
    window.addEventListener('emergencyDeactivated', checkEmergencyStatus)
    window.addEventListener('storage', checkEmergencyStatus)

    return () => {
      window.removeEventListener('emergencyActivated', checkEmergencyStatus)
      window.removeEventListener('emergencyDeactivated', checkEmergencyStatus)
      window.removeEventListener('storage', checkEmergencyStatus)
    }
  }, [])

  const value = {
    user,
    setUser,
    notifications,
    setNotifications,
    isEmergencyActive,
    setIsEmergencyActive,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export const useAppContext = () => {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider')
  }
  return context
}
