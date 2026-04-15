import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangleIcon } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'

function EmergencyBanner() {
  const [isActive, setIsActive] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const { user } = useAuth()

  // Check localStorage on mount and listen for changes
  useEffect(() => {
    // Initial check
    const checkEmergencyStatus = () => {
      const activeState = localStorage.getItem('emergencyModeActive')
      setIsActive(activeState === 'true')
    }

    checkEmergencyStatus()

    // Listen for storage changes (from other tabs)
    const handleStorageChange = () => {
      checkEmergencyStatus()
    }

    // Listen for custom events from same tab
    const handleEmergencyActivated = () => {
      checkEmergencyStatus()
    }

    const handleEmergencyDeactivated = () => {
      checkEmergencyStatus()
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('emergencyActivated', handleEmergencyActivated)
    window.addEventListener('emergencyDeactivated', handleEmergencyDeactivated)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('emergencyActivated', handleEmergencyActivated)
      window.removeEventListener('emergencyDeactivated', handleEmergencyDeactivated)
    }
  }, [])

  // Only show banner if user is authenticated and emergency is active
  // Don't show on login/signup pages
  if (!user || !isActive) {
    return null
  }

  return (
    <>
      <AnimatePresence>
        {isActive && (
          <>
            {/* Blocking overlay - prevents interaction with page */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
              onClick={(e) => e.preventDefault()}
            />

            {/* Emergency Banner */}
            <motion.div
              initial={{ y: -100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -100, opacity: 0 }}
              className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-red-600 to-red-700 text-white px-4 py-4 shadow-2xl"
            >
              <div className="max-w-7xl mx-auto flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    <AlertTriangleIcon className="w-6 h-6" />
                  </motion.div>
                  <div>
                    <p className="font-bold text-base sm:text-lg">
                      🚨 EMERGENCY MODE ACTIVE 🚨
                    </p>
                    <p className="text-xs sm:text-sm text-red-100 mt-1">
                      Your location has been shared with emergency contacts. Navigation is disabled.
                    </p>
                  </div>
                </div>
                {user?.role === 'user' && (
                  <button
                    onClick={() => setShowModal(true)}
                    className="px-4 py-2 bg-white text-red-600 rounded-lg font-semibold hover:bg-red-50 transition-colors text-sm whitespace-nowrap ml-4"
                  >
                    Manage
                  </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Deactivation Modal */}
      <AnimatePresence>
        {showModal && isActive && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="bg-red-50 p-6 border-b border-red-200">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600">
                  <AlertTriangleIcon className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-bold text-red-700 text-center">
                  Emergency Mode Active
                </h2>
              </div>

              <div className="p-6 text-center">
                <p className="text-gray-600 mb-8">
                  Your emergency contacts have been notified and are monitoring
                  the situation. You can deactivate emergency mode below when you
                  no longer need assistance.
                </p>

                <div className="space-y-3">
                  <button
                    onClick={() => setShowModal(false)}
                    className="w-full px-4 py-3 rounded-xl font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
                  >
                    Keep Active
                  </button>
                  <button
                    onClick={() => {
                      // Trigger deactivate from parent or emit event
                      window.dispatchEvent(
                        new CustomEvent('deactivateEmergency')
                      )
                      setShowModal(false)
                    }}
                    className="w-full px-4 py-3 rounded-xl font-bold text-white bg-red-600 hover:bg-red-700 shadow-lg shadow-red-600/20 transition-colors"
                  >
                    Deactivate Emergency Mode
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}

export default EmergencyBanner
