import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ShieldAlertIcon,
  PhoneIcon,
  XIcon,
  AlertTriangleIcon,
} from 'lucide-react'

function EmergencyButton({ contacts = [] }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isActivated, setIsActivated] = useState(false)

  const handleConfirm = () => {
    setIsActivated(true)
    // In a real app, this would trigger API calls to send SMS/Emails
  }

  const handleClose = () => {
    setIsOpen(false)
    setTimeout(() => setIsActivated(false), 300) // Reset after animation
  }

  return (
    <>
      <motion.button
        whileHover={{
          scale: 1.05,
        }}
        whileTap={{
          scale: 0.95,
        }}
        onClick={() => setIsOpen(true)}
        className="relative flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-full font-semibold shadow-lg shadow-red-600/20 transition-colors"
      >
        <ShieldAlertIcon className="w-5 h-5" />
        <span className="hidden sm:inline">Emergency</span>

        {/* Pulse effect */}
        <span className="absolute inset-0 rounded-full border-2 border-red-500 animate-ping opacity-20"></span>
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
                    <ul className="space-y-3 mb-6">
                      {contacts.map((contact) => (
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

                    <div className="flex gap-3">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleConfirm}
                        className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-lg font-semibold shadow-lg shadow-red-600/20 transition-colors"
                      >
                        <PhoneIcon className="w-5 h-5" />
                        Confirm & Notify
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleClose}
                        className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg font-medium transition-colors"
                      >
                        <XIcon className="w-5 h-5" />
                      </motion.button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="p-8 text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600">
                    <ShieldAlertIcon className="w-8 h-8" />
                  </div>
                  <h2 className="text-2xl font-bold text-green-800 mb-2">
                    Emergency Mode Activated
                  </h2>
                  <p className="text-green-700/80 text-sm mb-6">
                    Your emergency contacts have been notified. Help is on the
                    way.
                  </p>
                  <button
                    onClick={handleClose}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-600 px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    Close
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
