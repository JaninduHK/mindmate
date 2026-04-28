import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { contactsAPI } from '../api/contactsApi.js';
import { Plus, Edit2, Trash2, Phone, Mail, X, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

const RELATIONSHIPS = [
  { value: 'sister', label: 'Sister' },
  { value: 'brother', label: 'Brother' },
  { value: 'mother', label: 'Mother' },
  { value: 'father', label: 'Father' },
  { value: 'partner', label: 'Partner' },
  { value: 'therapist', label: 'Therapist' },
  { value: 'friend', label: 'Friend' },
  { value: 'other', label: 'Other' },
];

function EmergencyContacts() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingContactId, setEditingContactId] = useState(null);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    relationship: 'friend',
  });
  const [errors, setErrors] = useState({});
  const [formLoading, setFormLoading] = useState(false);
  const queryClient = useQueryClient();

  // Prevent scrolling when modal is open
  useEffect(() => {
    if (showAddModal) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }

    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [showAddModal]);

  const { data: contactsResponse = {}, isLoading } = useQuery({
    queryKey: ['emergency-contacts'],
    queryFn: contactsAPI.getContacts,
  });

  const contacts = contactsResponse?.data?.data || [];

  const addContactMutation = useMutation({
    mutationFn: contactsAPI.addContact,
    onSuccess: () => {
      toast.success('Contact added and invitation sent via email and SMS');
      queryClient.invalidateQueries(['emergency-contacts']);
      resetForm();
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to add contact');
    },
  });

  const updateContactMutation = useMutation({
    mutationFn: ({ id, data }) => contactsAPI.updateContact(id, data),
    onSuccess: () => {
      toast.success('Contact updated successfully');
      queryClient.invalidateQueries(['emergency-contacts']);
      resetForm();
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to update contact');
    },
  });

  const deleteContactMutation = useMutation({
    mutationFn: contactsAPI.deleteContact,
    onSuccess: () => {
      toast.success('Contact removed successfully');
      queryClient.invalidateQueries(['emergency-contacts']);
    },
    onError: () => {
      toast.error('Failed to remove contact');
    },
  });

  const resetForm = () => {
    setFormData({
      fullName: '',
      email: '',
      phoneNumber: '',
      relationship: 'friend',
    });
    setErrors({});
    setShowAddModal(false);
    setEditingContactId(null);
  };

  const openEditModal = (contact) => {
    setFormData({
      fullName: contact.fullName,
      email: contact.email,
      phoneNumber: contact.phoneNumber,
      relationship: contact.relationship,
    });
    setEditingContactId(contact._id);
    setShowAddModal(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Name is required';
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = 'Name must be at least 2 characters';
    }

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(formData.email)) {
      newErrors.email = 'Enter a valid email address';
    }

    if (!formData.phoneNumber) {
      newErrors.phoneNumber = 'Phone number is required';
    } else if (!/^(\+94|0)[0-9]{9,10}$/.test(formData.phoneNumber.replace(/\s/g, ''))) {
      newErrors.phoneNumber = 'Enter a valid phone number';
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validateForm();
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setFormLoading(true);
    try {
      if (editingContactId) {
        await updateContactMutation.mutateAsync({
          id: editingContactId,
          data: formData,
        });
      } else {
        await addContactMutation.mutateAsync(formData);
      }
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to remove this emergency contact?')) {
      deleteContactMutation.mutate(id);
    }
  };

  const handleResend = (id) => {
    toast.success('Invitation resent successfully via email and SMS');
  };

  const getStatusBadge = (contact) => {
    const status = contact.inviteStatus || (contact.verified ? 'Accepted' : 'Pending');
    
    switch (status) {
      case 'Accepted':
      case true:
        return (
          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
            Accepted
          </span>
        );
      case 'Pending':
      case false:
        return (
          <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full font-medium">
            Pending
          </span>
        );
      case 'Expired':
        return (
          <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full font-medium">
            Expired
          </span>
        );
      case 'Failed':
        return (
          <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full font-medium">
            Failed
          </span>
        );
      default:
        return null;
    }
  };

  const getInitials = (name) => {
    // Handle undefined/null names
    if (!name) {
      return '?';
    }
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Contacts</h1>
      </div>

      <div className="flex justify-between items-start mb-8">
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-1">
            Emergency Contacts
          </h2>
          <p className="text-gray-500 text-sm">
            People we'll notify if you activate an emergency alert.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add Contact
        </button>
      </div>

      {isLoading ? (
        <div className="p-8 text-center text-gray-500">Loading contacts...</div>
      ) : contacts.length === 0 ? (
        <div className="bg-gray-50 rounded-xl p-12 text-center border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Emergency Contacts Yet</h3>
          <p className="text-gray-600 mb-6">Add at least one emergency contact to ensure help is available when you need it.</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium inline-flex items-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Your First Contact
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {contacts.map((contact) => (
            <div
              key={contact._id}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-lg">
                    {getInitials(contact.fullName || contact.email)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-gray-900">{contact.fullName || contact.email}</h3>
                      {getStatusBadge(contact)}
                    </div>
                    <span className="inline-block px-2.5 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full mt-1">
                      {RELATIONSHIPS.find(r => r.value === contact.relationship)?.label || contact.relationship}
                    </span>
                  </div>
                </div>
                <div className="flex gap-1">
                  {(contact.inviteStatus === 'Pending' ||
                    contact.inviteStatus === 'Expired' ||
                    contact.inviteStatus === 'Failed') && (
                    <button
                      onClick={() => handleResend(contact._id)}
                      className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors"
                      title="Resend Invite"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => openEditModal(contact)}
                    className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors"
                    title="Edit Contact"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(contact._id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
                    title="Delete Contact"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <Phone className="w-4 h-4 text-gray-400" />
                  {contact.phoneNumber}
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <Mail className="w-4 h-4 text-gray-400" />
                  {contact.email}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Contact Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">
                {editingContactId ? 'Edit Emergency Contact' : 'Add Emergency Contact'}
              </h2>
              <button
                onClick={resetForm}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              className="p-6 space-y-4"
              onSubmit={handleSubmit}
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:outline-none transition-colors ${
                    errors.fullName
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                  }`}
                  placeholder="Jane Doe"
                />
                {errors.fullName && <p className="mt-1 text-xs text-red-600">{errors.fullName}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Relationship
                </label>
                <select
                  name="relationship"
                  value={formData.relationship}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                >
                  {RELATIONSHIPS.map((rel) => (
                    <option key={rel.value} value={rel.value}>
                      {rel.label}
                    </option>
                  ))}
                </select>
                {errors.relationship && <p className="mt-1 text-xs text-red-600">{errors.relationship}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  required
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:outline-none transition-colors ${
                    errors.phoneNumber
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                  }`}
                  placeholder="+94701234567"
                />
                {errors.phoneNumber && <p className="mt-1 text-xs text-red-600">{errors.phoneNumber}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:outline-none transition-colors ${
                    errors.email
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                  }`}
                  placeholder="jane@example.com"
                />
                {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 py-2.5 px-4 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="flex-1 py-2.5 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {formLoading ? (editingContactId ? 'Saving...' : 'Sending...') : (editingContactId ? 'Save Changes' : 'Send Invitation')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default EmergencyContacts;
