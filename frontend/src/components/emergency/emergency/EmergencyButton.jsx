import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { axiosInstance } from '../../../api/axios.config.js'
import toast from 'react-hot-toast'
import { contactsAPI } from '../../../api/contactsApi.js'
import {
  ShieldAlertIcon,
  PhoneIcon,
  XIcon,
  AlertTriangleIcon,
} from 'lucide-react'

function EmergencyButton({ contacts = [] }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isActivated, setIsActivated] = useState(false)
  const [emergencyActive, setEmergencyActive] = useState(false)
  const [emergencyContacts, setEmergencyContacts] = useState([])
  const [loading, setLoading] = useState(false)
  const [confirmLoading, setConfirmLoading] = useState(false)

  // Check localStorage for active emergency on mount
  useEffect(() => {
    const activeState = localStorage.getItem('emergencyModeActive')
    if (activeState === 'true') {
      setEmergencyActive(true)
      setIsActivated(true)
    }

    // Listen for deactivate event from banner
    const handleDeactivateEvent = () => {
      handleDeactivate()
    }

    window.addEventListener('deactivateEmergency', handleDeactivateEvent)
    return () => window.removeEventListener('deactivateEmergency', handleDeactivateEvent)
  }, [])

  // Fetch real emergency contacts from backend when modal opens
  useEffect(() => {
    if (isOpen && emergencyContacts.length === 0) {
      fetchEmergencyContacts()
    }
  }, [isOpen])

  const fetchEmergencyContacts = async () => {
    try {
      setLoading(true)
      const response = await contactsAPI.getContacts()
      
      // Handle different response formats from API
      let contactsList = []
      if (response?.data && Array.isArray(response.data)) {
        // If response.data is array directly
        contactsList = response.data
      } else if (response && Array.isArray(response)) {
        // If response is array directly
        contactsList = response
      } else if (response?.data?.data && Array.isArray(response.data.data)) {
        // If nested in { data: { data: [...] } }
        contactsList = response.data.data
      }

      console.log('Emergency contacts response:', response)
      console.log('Extracted contacts list:', contactsList)

      // Map backend field names to display names
      const mappedContacts = Array.isArray(contactsList) ? contactsList.map((contact) => ({
        id: contact._id,
        name: contact.fullName,
        relationship: contact.relationship,
        phone: contact.phoneNumber,
        email: contact.email,
      })) : []

      setEmergencyContacts(mappedContacts)
      if (mappedContacts.length > 0) {
        toast.success(`Loaded ${mappedContacts.length} emergency contacts`)
      }
    } catch (error) {
      console.error('Error fetching emergency contacts:', error)
      setEmergencyContacts([])
      toast.error('Failed to load emergency contacts')
    } finally {
      setLoading(false)
    }
  }

  const handleConfirm = async () => {
    try {
      setConfirmLoading(true)
      
      // Try to get current location
      let location = null
      if (navigator.geolocation) {
        try {
          const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject)
          })
          location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy
          }
        } catch (error) {
          console.warn('Could not get location:', error)
          toast.success('Emergency activated without location data')
        }
      }
      
      // Call backend to activate emergency
      const response = await axiosInstance.post(
        '/user/emergency/activate',
        {
          contactIds: emergencyContacts.map(c => c.id),
          location
        }
      )
      
      // Set emergency active state
      setEmergencyActive(true)
      localStorage.setItem('emergencyModeActive', 'true')
      setIsActivated(true)
      
      // Dispatch custom event to notify other components
      window.dispatchEvent(new CustomEvent('emergencyActivated'))
      
      toast.success('Emergency activated! Alerts sent to your contacts')
    } catch (error) {
      console.error('Error activating emergency:', error)
      toast.error('Failed to activate emergency mode')
    } finally {
      setConfirmLoading(false)
    }
  }

  const handleDeactivate = async () => {
    try {
      setConfirmLoading(true)
      
      // Call backend to deactivate emergency
      await axiosInstance.post(
        '/user/emergency/deactivate',
        {}
      )
      
      // Clear emergency state
      setEmergencyActive(false)
      localStorage.removeItem('emergencyModeActive')
      setIsActivated(false)
      setIsOpen(false)
      
      // Dispatch custom event to notify other components
      window.dispatchEvent(new CustomEvent('emergencyDeactivated'))
      
      toast.success('Emergency mode deactivated')
    } catch (error) {
      console.error('Error deactivating emergency:', error)
      toast.error('Failed to deactivate emergency')
    } finally {
      setConfirmLoading(false)
    }
  }

  const handleClose = () => {
    setIsOpen(false)
    // Don't reset isActivated - just close the modal
  }

  return (
    <>
      <motion.button
        whileHover={{
          scale: emergencyActive ? 1.0 : 1.05,
        }}
        whileTap={{
          scale: emergencyActive ? 1.0 : 0.95,
        }}
        animate={emergencyActive ? {
          backgroundColor: ['#dc2626', '#7f1d1d']
        } : {}}
        transition={emergencyActive ? {
          duration: 1,
          repeat: Infinity,
          repeatType: 'reverse'
        } : {}}
        onClick={() => setIsOpen(true)}
        className={`relative flex items-center gap-2 text-white px-4 py-2 rounded-full font-semibold shadow-lg transition-colors ${
          emergencyActive 
            ? 'bg-red-600 shadow-red-600/40' 
            : 'bg-red-600 hover:bg-red-700 shadow-red-600/20'
        }`}
      >
        <ShieldAlertIcon className="w-5 h-5" />
        <span className="hidden sm:inline">
          {emergencyActive ? 'Emergency Active' : 'Emergency'}
        </span>

        {/* Pulse effect */}
        <span className={`absolute inset-0 rounded-full border-2 ${
          emergencyActive 
            ? 'border-red-700 animate-pulse' 
            : 'border-red-500 animate-ping opacity-20'
        }`}></span>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{
                opacity: 0,
                scale: 0.95,
                y: 20,
              }}
              animate={{
                opacity: 1,
                scale: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
                scale: 0.95,
                y: 20,
              }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              {!isActivated ? (
                <>
                  <div className="bg-red-50 p-6 text-center border-b border-red-100">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600">
                      <AlertTriangleIcon className="w-8 h-8" />
                    </div>
                    <h2 className="text-2xl font-bold text-red-700 mb-2">
                      Activate Emergency Mode?
                    </h2>
                    <p className="text-red-600/80 text-sm">
                      This will immediately share your location and send an
                      alert to your emergency contacts.
                    </p>
                  </div>

                  <div className="p-6">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                      Contacts to be notified
                    </h3>
                    {loading ? (
                      <div className="text-center py-8">
                        <p className="text-gray-500 text-sm">Loading contacts...</p>
                      </div>
                    ) : emergencyContacts.length === 0 ? (
                      <div className="text-center py-8 bg-yellow-50 rounded-lg border border-yellow-200 mb-6">
                        <p className="text-yellow-700 text-sm">
                          No emergency contacts set
                        </p>
                      </div>
                    ) : (
                      <ul className="space-y-3 mb-6">
                        {emergencyContacts.map((contact) => (
                          <li
                            key={contact.id}
                            className="flex items-center justify-between bg-gray-50 p-3 rounded-lg"
                          >
                            <div>
                              <p className="font-medium text-gray-800">
                                {contact.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {contact.relationship}
                              </p>
                            </div>
                            <span className="text-sm text-gray-600">
                              {contact.phone}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}

                    <div className="flex gap-3">
                      <button
                        onClick={handleClose}
                        className="flex-1 px-4 py-3 rounded-xl font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleConfirm}
                        disabled={loading || emergencyContacts.length === 0 || confirmLoading}
                        className="flex-1 px-4 py-3 rounded-xl font-bold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-600/20 transition-colors"
                      >
                        {confirmLoading ? 'Activating...' : 'Confirm Emergency'}
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="relative p-8 text-center">
                  {/* X button to close without deactivating */}
                  <button
                    onClick={handleClose}
                    className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
                    title="Close (Emergency remains active)"
                  >
                    <XIcon className="w-6 h-6 text-gray-500 hover:text-gray-700" />
                  </button>

                  <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6 text-red-600 relative">
                    <span className="absolute inset-0 rounded-full border-4 border-red-500 animate-ping opacity-30"></span>
                    <ShieldAlertIcon className="w-10 h-10" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Emergency Mode Active
                  </h2>
                  <p className="text-gray-600 mb-8">
                    Alerts have been sent to your contacts with your current
                    location. A banner is visible on all pages.
                  </p>

                  <div className="space-y-3 mb-8">
                    <a
                      href="tel:911"
                      className="flex items-center justify-center gap-3 w-full bg-gray-900 text-white p-4 rounded-xl font-bold hover:bg-gray-800 transition-colors"
                    >
                      <PhoneIcon className="w-5 h-5" />
                      Call 911
                    </a>
                    <a
                      href="tel:988"
                      className="flex items-center justify-center gap-3 w-full bg-teal-600 text-white p-4 rounded-xl font-bold hover:bg-teal-700 transition-colors"
                    >
                      <PhoneIcon className="w-5 h-5" />
                      Call Crisis Hotline (988)
                    </a>
                  </div>

                  <button
                    onClick={handleDeactivate}
                    disabled={confirmLoading}
                    className="w-full px-4 py-3 rounded-xl font-bold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 transition-colors"
                  >
                    {confirmLoading ? 'Deactivating...' : 'Deactivate Emergency Mode'}
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}

export default EmergencyButton