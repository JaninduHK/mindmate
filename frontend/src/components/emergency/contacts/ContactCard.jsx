import { useState } from 'react';
import { Mail, Phone, MoreVertical, Edit, Trash2, Send } from 'lucide-react';
import { motion } from 'framer-motion';
import Button from '../../common/Button.jsx';

const Backdrop = ({ onClick }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    onClick={onClick}
    className="fixed inset-0 bg-black/50 z-40"
  />
);

const DeleteConfirmModal = ({ isOpen, onConfirm, onCancel, contactName, isLoading }) => {
  if (!isOpen) return null;

  return (
    <>
      <Backdrop onClick={onCancel} />
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="fixed inset-0 flex items-center justify-center z-50 p-4"
      >
        <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden">
          <div className="p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Delete {contactName}?
            </h3>
            <p className="text-gray-600 mb-6">
              This action cannot be undone. {contactName} will no longer be notified in emergencies.
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={onCancel}
                disabled={isLoading}
                fullWidth
              >
                Cancel
              </Button>
              <Button
                onClick={onConfirm}
                loading={isLoading}
                className="bg-red-600 hover:bg-red-700"
                fullWidth
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
};

const ContactCard = ({ contact, onEdit, onDelete, onResendInvite, isResending }) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const statusColor =
    contact.status === 'active'
      ? 'bg-green-100 text-green-800'
      : 'bg-yellow-100 text-yellow-800';

  const statusLabel =
    contact.status === 'active'
      ? '✓ Confirmed'
      : '⏳ Pending';

  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow border border-gray-100 p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white font-bold">
              {contact.fullName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">{contact.fullName}</h3>
              <p className="text-xs text-gray-500">{contact.relationship}</p>
              <span className={`inline-block mt-2 px-2 py-1 rounded-full text-xs font-semibold ${statusColor}`}>
                {statusLabel}
              </span>
            </div>
          </div>

          {/* Menu */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
            >
              <MoreVertical className="w-5 h-5 text-gray-400" />
            </button>

            {showMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                <button
                  onClick={() => {
                    onEdit(contact);
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2 text-gray-700"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={() => {
                    setShowDeleteConfirm(true);
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-red-50 flex items-center gap-2 text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Contact Info */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-gray-700">
            <Mail className="w-4 h-4 text-gray-400" />
            <a href={`mailto:${contact.email}`} className="text-sm hover:text-primary-600 break-all">
              {contact.email}
            </a>
          </div>
          {contact.phoneNumber && (
            <div className="flex items-center gap-2 text-gray-700">
              <Phone className="w-4 h-4 text-gray-400" />
              <a href={`tel:${contact.phoneNumber}`} className="text-sm hover:text-primary-600">
                {contact.phoneNumber}
              </a>
            </div>
          )}
        </div>

        {/* Resend button for pending */}
        {contact.status !== 'active' && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onResendInvite(contact._id)}
            loading={isResending}
            className="w-full flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" />
            Resend Invite
          </Button>
        )}
      </div>

      {/* Delete Confirm Modal */}
      <DeleteConfirmModal
        isOpen={showDeleteConfirm}
        onConfirm={() => {
          onDelete(contact._id);
          setShowDeleteConfirm(false);
        }}
        onCancel={() => setShowDeleteConfirm(false)}
        contactName={contact.fullName}
        isLoading={false}
      />
    </>
  );
};

export default ContactCard;
