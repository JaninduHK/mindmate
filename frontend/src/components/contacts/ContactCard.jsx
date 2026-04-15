import { Edit2, Trash2, RotateCcw, User, Phone, Mail } from 'lucide-react';
import { useState } from 'react';

const InviteStatusBadge = ({ status }) => {
  const statusConfig = {
    pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending Invite' },
    accepted: { bg: 'bg-green-100', text: 'text-green-800', label: 'Accepted' },
    expired: { bg: 'bg-red-100', text: 'text-red-800', label: 'Expired' },
    failed: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Failed' },
  };

  const config = statusConfig[status?.toLowerCase()] || statusConfig.pending;

  return (
    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text}`}>
      {config.label}
    </span>
  );
};

const ContactCard = ({ contact, onEdit, onDelete, onResendInvite, isResending }) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    onDelete(contact._id);
    setShowDeleteConfirm(false);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start space-x-3 flex-1">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
            {contact.fullName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 truncate">{contact.fullName}</h3>
            <p className="text-sm text-gray-500 capitalize">{contact.relationship}</p>
          </div>
        </div>

        {/* Status badge */}
        <div className="flex-shrink-0">
          <InviteStatusBadge status={contact.inviteStatus} />
        </div>
      </div>

      {/* Contact details */}
      <div className="space-y-2 mb-4">
        {contact.email && (
          <div className="flex items-center space-x-2 text-sm">
            <Mail className="w-4 h-4 text-gray-400" />
            <a href={`mailto:${contact.email}`} className="text-primary-600 hover:underline truncate">
              {contact.email}
            </a>
          </div>
        )}
        {contact.phoneNumber && (
          <div className="flex items-center space-x-2 text-sm">
            <Phone className="w-4 h-4 text-gray-400" />
            <a href={`tel:${contact.phoneNumber}`} className="text-gray-700 hover:text-gray-900">
              {contact.phoneNumber}
            </a>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        {contact.inviteStatus?.toLowerCase() === 'pending' && (
          <button
            onClick={() => onResendInvite(contact._id)}
            disabled={isResending}
            className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
            aria-label="Resend invitation"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Resend</span>
          </button>
        )}
        
        <button
          onClick={handleDeleteClick}
          className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 text-sm font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
          aria-label="Delete contact"
        >
          <Trash2 className="w-4 h-4" />
          <span>Delete</span>
        </button>

        <button
          onClick={() => onEdit(contact)}
          className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 text-sm font-medium text-primary-700 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors"
          aria-label="Edit contact"
        >
          <Edit2 className="w-4 h-4" />
          <span>Edit</span>
        </button>
      </div>

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Delete Emergency Contact?
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to remove <strong>{contact.fullName}</strong> as an emergency contact?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg text-gray-900 font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex-1 px-4 py-2 bg-red-600 rounded-lg text-white font-medium hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContactCard;
export { InviteStatusBadge };
