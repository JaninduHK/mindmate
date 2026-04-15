import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, X } from 'lucide-react';
import { useEmergency } from '../../../context/EmergencyContext.jsx';
import Button from '../../common/Button.jsx';

const EmergencyBanner = () => {
  const { isEmergencyActive, mostRecentActivation, deactivateEmergency } = useEmergency();

  if (!isEmergencyActive) return null;

  const contactCount = mostRecentActivation?.selectedContacts?.length || 0;

  return (
    <AnimatePresence>
      {isEmergencyActive && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-50 bg-red-600 text-white py-3 px-4"
        >
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-6 h-6 animate-bounce" />
              <div>
                <p className="font-semibold">Emergency Mode Active</p>
                <p className="text-xs text-red-100">
                  {contactCount} contact{contactCount !== 1 ? 's' : ''} notified with your location
                </p>
              </div>
            </div>
            <button
              onClick={deactivateEmergency}
              className="ml-4 p-1 hover:bg-red-700 rounded transition-colors"
              aria-label="Deactivate emergency mode"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default EmergencyBanner;
