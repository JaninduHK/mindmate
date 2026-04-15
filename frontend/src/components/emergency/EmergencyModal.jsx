import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, ShieldAlert, Phone, X, MapPin } from 'lucide-react'
import { useAppContext } from '../context/AppContext'

const mockContacts = [
  {
    id: 1,
    name: 'Sneha Jayawardana',
    phone: '+94 71 234 5678',
    relation: 'Sister',
  },
  {
    id: 2,
    name: 'Dr. Emily Chen',
    phone: '+94 71 987 6543',
    relation: 'Therapist',
  },
  {
    id: 3,
    name: 'Kamal Perera',
    phone: '+94 71 123 4567',
    relation: 'Friend',
  },
]

export const EmergencyModal = () => {
  const {
    showEmergencyModal,
    setShowEmergencyModal,
    isEmergencyActive,
    activateEmergency,
    deactivateEmergency,
    emergencyConfig,
    preferences,
  } = useAppContext()

  const [locationStatus, setLocationStatus] = useState('idle')
  const [selectedContacts, setSelectedContacts] = useState(
    mockContacts.map((c) => c.id)
  )

  if (!showEmergencyModal) return null

  const handleSelectContact = (contactId) => {
    setSelectedContacts((prev) =>
      prev.includes(contactId)
        ? prev.filter((id) => id !== contactId)
        : [...prev, contactId]
    )
  }

  const handleActivate = () => {
    if (preferences.gpsEnabled) {
      setLocationStatus('loading')
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setLocationStatus('success')
            activateEmergency({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            })
          },
          (error) => {
            console.error('Error getting location:', error)
            setLocationStatus('error')
            activateEmergency()
          },
          { timeout: 5000 },
        )
      } else {
        setLocationStatus('error')
        activateEmergency()
      }
    } else {
      activateEmergency()
    }
  }

  return (
    <AnimatePresence>
      {showEmergencyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowEmergencyModal(false)}
            className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="relative bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden z-10"
          >
            <button
              onClick={() => setShowEmergencyModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {!isEmergencyActive ? (
              // Confirmation Step
              <div>
                {/* Header */}
                <div className="p-6 pb-0 flex flex-col items-center text-center mt-2">
                  <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
                    <AlertTriangle className="w-8 h-8 text-red-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-red-600 mb-2">
                    Activate Emergency Mode?
                  </h2>
                  <p className="text-gray-500 text-sm mb-4">
                    Notify your emergency contacts immediately
                  </p>
                </div>

                {/* Body */}
                <div className="px-6 pb-2">
                  <p className="text-gray-600 text-sm mb-3">
                    {preferences.gpsEnabled
                      ? 'Your location and an alert will be sent to the selected contacts.'
                      : 'An alert will be sent to the selected contacts.'}
                  </p>

                  {/* Contacts with checkboxes */}
                  <div className="mb-4">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      Contacts to be notified
                    </h3>
                    <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                      {mockContacts.map((contact) => (
                        <label
                          key={contact.id}
                          className="flex items-center justify-between bg-gray-50 p-3 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex-1">
                            <p className="font-medium text-gray-900 text-sm">
                              {contact.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {contact.relation} · {contact.phone}
                            </p>
                          </div>
                          <input
                            type="checkbox"
                            checked={selectedContacts.includes(contact.id)}
                            onChange={() => handleSelectContact(contact.id)}
                            className="w-4 h-4 cursor-pointer accent-red-600 ml-3"
                          />
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* GPS Warning */}
                  {preferences.gpsEnabled && (
                    <div className="flex items-start gap-2 bg-amber-50 border-l-4 border-amber-400 rounded-lg p-3 mb-4">
                      <MapPin className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                      <p className="text-xs text-amber-800">
                        Your location will be shared with selected contacts when
                        you confirm.
                      </p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-3 px-6 pb-6 border-t border-gray-100 pt-4">
                  <button
                    onClick={() => setShowEmergencyModal(false)}
                    disabled={locationStatus === 'loading'}
                    className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleActivate}
                    disabled={
                      locationStatus === 'loading' ||
                      selectedContacts.length === 0
                    }
                    className="flex-1 py-3 px-4 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors shadow-sm flex justify-center items-center gap-2 disabled:opacity-70"
                  >
                    {locationStatus === 'loading' ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Activating...
                      </>
                    ) : (
                      'Confirm Emergency'
                    )}
                  </button>
                </div>
              </div>
            ) : (
              // Active State Step
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-8 flex flex-col items-center text-center mt-2"
              >
                <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6">
                  <ShieldAlert className="w-10 h-10 text-red-600 animate-pulse" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">
                  Emergency Mode Active
                </h2>
                <p className="text-gray-600 mb-4 max-w-xs mx-auto">
                  Alerts have been sent to your contacts.
                </p>

                {preferences.gpsEnabled && locationStatus === 'error' && (
                  <div className="flex items-center gap-1.5 text-orange-600 text-xs font-medium bg-orange-50 px-3 py-1.5 rounded-full mb-6">
                    <MapPin className="w-3.5 h-3.5" /> Location unavailable
                  </div>
                )}

                <div className="w-full space-y-3 mb-6">
                  <a
                    href={`tel:${emergencyConfig.emergencyNumber}`}
                    className="w-full flex items-center justify-center gap-2 py-4 px-4 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors"
                  >
                    <Phone className="w-5 h-5" />
                    Call {emergencyConfig.emergencyNumber}
                  </a>
                  <a
                    href={`tel:${emergencyConfig.crisisHotline}`}
                    className="w-full flex items-center justify-center gap-2 py-4 px-4 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors"
                  >
                    <Phone className="w-5 h-5" />
                    Call Crisis Hotline ({emergencyConfig.crisisHotline})
                  </a>
                  <a
                    href={`tel:${mockContacts[0].phone}`}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gray-100 text-gray-800 rounded-xl font-medium hover:bg-gray-200 transition-colors text-sm"
                  >
                    <Phone className="w-4 h-4" />
                    Call {mockContacts[0].name} ({mockContacts[0].relation})
                  </a>
                </div>

                <button
                  onClick={deactivateEmergency}
                  className="text-gray-500 hover:text-gray-700 font-medium underline underline-offset-4 text-sm"
                >
                  Deactivate Emergency Mode
                </button>
              </motion.div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

