import { motion } from 'framer-motion';
import { AlertCircle, PhoneCall, MessageCircle, X } from 'lucide-react';
import { useEmergency } from '../../../context/EmergencyContext.jsx';
import Button from '../../common/Button.jsx';

const Backdrop = ({ onClick }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    onClick={onClick}
    className="modal-overlay"
    style={{ backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)' }}
  />
);

const EmergencyActiveModal = ({ onClose }) => {
  const { deactivateEmergency } = useEmergency();
  const emergencyNumber = '+1-800-273-8255'; // National Suicide Prevention Lifeline
  const crisisNumber = '+44-1632-960000'; // UK Crisis line (example)

  return (
    <>
      <Backdrop onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="modal-overlay"
      >
        <div className="modal-content">
          {/* Header - Animated */}
          <motion.div
            animate={{
              rgb: ['rgb(220, 38, 38)', 'rgb(239, 68, 68)', 'rgb(220, 38, 38)'],
            }}
            transition={{ duration: 2, repeat: Infinity }}
            className="modal-header"
            style={{ backgroundColor: 'rgb(220, 38, 38)' }}
          >
            <div className="modal-icon-container" style={{ backgroundColor: 'rgba(254, 202, 202, 0.8)' }}>
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                <AlertCircle className="modal-icon" />
              </motion.div>
            </div>
            <h2 className="modal-title">Emergency Mode Active</h2>
            <p className="modal-description">Contacts have been notified</p>
          </motion.div>

          {/* Content */}
          <div className="modal-body">
            {/* Success message */}
            <div style={{ backgroundColor: '#dcfce7', border: '1px solid #86efac', borderRadius: '0.5rem', padding: '1rem', marginBottom: '1.5rem' }}>
              <p style={{ fontSize: '0.875rem', color: '#15803d' }}>
                ✓ Your emergency contacts have been notified with your location (if GPS enabled).
              </p>
            </div>

            {/* Crisis Resources */}
            <div style={{ marginBottom: '1.5rem' }}>
              <p style={{ fontSize: '0.875rem', fontWeight: '600', color: '#1f2937', marginBottom: '0.75rem' }}>Get immediate help:</p>

              <a
                href={`tel:${emergencyNumber}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  backgroundColor: '#dc2626',
                  color: '#ffffff',
                  padding: '1rem',
                  borderRadius: '0.5rem',
                  marginBottom: '0.75rem',
                  textDecoration: 'none',
                  transition: 'background-color 0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#b91c1c'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#dc2626'}
              >
                <PhoneCall style={{ width: '1.25rem', height: '1.25rem', flexShrink: 0 }} />
                <div>
                  <p style={{ fontWeight: '600', marginBottom: '0.25rem' }}>Emergency Number</p>
                  <p style={{ fontSize: '0.875rem' }}>{emergencyNumber}</p>
                </div>
              </a>

              <a
                href={`sms:${crisisNumber}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  backgroundColor: '#0d9488',
                  color: '#ffffff',
                  padding: '1rem',
                  borderRadius: '0.5rem',
                  textDecoration: 'none',
                  transition: 'background-color 0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#115e59'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#0d9488'}
              >
                <MessageCircle style={{ width: '1.25rem', height: '1.25rem', flexShrink: 0 }} />
                <div>
                  <p style={{ fontWeight: '600', marginBottom: '0.25rem' }}>Crisis Text Line</p>
                  <p style={{ fontSize: '0.875rem' }}>Text HOME to {crisisNumber}</p>
                </div>
              </a>
            </div>

            {/* Warning */}
            <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '0.5rem', padding: '0.75rem' }}>
              <p style={{ fontSize: '0.75rem', color: '#1e40af' }}>
                <strong>Important:</strong> If you are in immediate physical danger, call 911 or your local emergency number directly.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="modal-actions" style={{ padding: '1.5rem', borderTop: '1px solid #e5e7eb' }}>
            <button
              onClick={onClose}
              className="cancel-button"
              style={{ flex: 1 }}
            >
              Keep Active
            </button>
            <button
              onClick={deactivateEmergency}
              className="cancel-button"
              style={{ flex: 1 }}
            >
              Deactivate
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
};

export default EmergencyActiveModal;
