import { motion } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';
import { useEmergency } from '../../context/EmergencyContext.jsx';

const EmergencyModeBanner = () => {
  const { isEmergencyActive, deactivateEmergency } = useEmergency();

  if (!isEmergencyActive) return null;

  return (
    <motion.div
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -100, opacity: 0 }}
      className="fixed top-0 left-0 right-0 z-40 bg-red-600 text-white"
    >
      <div className="container-custom py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            <AlertTriangle className="w-5 h-5" />
          </motion.div>
          <div>
            <p className="font-semibold">🚨 Emergency Mode Active</p>
            <p className="text-xs text-red-100">Your emergency contacts have been notified - Click to deactivate</p>
          </div>
        </div>
        <button
          onClick={deactivateEmergency}
          className="p-2 hover:bg-red-700 rounded transition-colors"
          title="Deactivate Emergency Mode"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </motion.div>
  );
};

export default EmergencyModeBanner;
