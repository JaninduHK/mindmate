import { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, X, MapPin } from 'lucide-react';
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

const EmergencyConfirmModal = ({ onClose, contacts = [] }) => {
  const { activateEmergency } = useEmergency();
  const [selectedContacts, setSelectedContacts] = useState(
    contacts.map((c) => c._id)
  );
  const [isActivating, setIsActivating] = useState(false);

  const handleSelectContact = (contactId) => {
    setSelectedContacts((prev) =>
      prev.includes(contactId)
        ? prev.filter((id) => id !== contactId)
        : [...prev, contactId]
    );
  };

  const handleConfirm = async () => {
    setIsActivating(true);
    try {
      await activateEmergency(selectedContacts);
      onClose();
    } finally {
      setIsActivating(false);
    }
  };

  const displayedContacts = contacts.slice(0, 3);
  const hiddenCount = Math.max(0, contacts.length - 3);

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
          {/* Header */}
          <div className="modal-header">
            <div className="modal-icon-container">
              <AlertTriangle className="modal-icon" />
            </div>
            <h2 className="modal-title">Activate Emergency Mode</h2>
            <p className="modal-description">Notify your emergency contacts immediately</p>
          </div>

          {/* Content */}
          <div className="modal-body">
            <p style={{ color: '#4b5563', marginBottom: '1rem' }}>
              Your emergency contacts will be notified immediately:
            </p>

            {/* Contacts to notify */}
            <div className="contacts-list">
              {displayedContacts.map((contact) => (
                <label key={contact._id} className="contact-item">
                  <div style={{ flex: 1 }}>
                    <div className="contact-info">{contact.fullName}</div>
                    <div className="contact-relationship">{contact.email}</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={selectedContacts.includes(contact._id)}
                    onChange={() => handleSelectContact(contact._id)}
                    style={{ cursor: 'pointer', width: '1.25rem', height: '1.25rem' }}
                  />
                </label>
              ))}

              {hiddenCount > 0 && (
                <p style={{ fontSize: '0.75rem', color: '#9ca3af', padding: '0.5rem' }}>
                  +{hiddenCount} more contact{hiddenCount !== 1 ? 's' : ''}
                </p>
              )}
            </div>

            {/* GPS Warning */}
            <div style={{ backgroundColor: '#fef3c7', borderLeft: '4px solid #f59e0b', borderRadius: '0.5rem', padding: '0.75rem', marginTop: '1rem' }}>
              <p style={{ fontSize: '0.875rem', color: '#78350f' }}>
                ⚠️ Your location will be shared if you have GPS enabled in settings.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '0.75rem', padding: '1.5rem', borderTop: '1px solid #e5e7eb' }}>
            <button
              onClick={onClose}
              disabled={isActivating}
              className="cancel-button"
              style={{ flex: 1 }}
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={isActivating || selectedContacts.length === 0}
              className="confirm-button"
              style={{ flex: 1, opacity: isActivating ? 0.7 : 1 }}
            >
              {isActivating ? 'Confirming...' : 'Confirm Emergency'}
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
};

export default EmergencyConfirmModal;
