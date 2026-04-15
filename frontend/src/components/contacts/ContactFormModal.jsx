import { X, User, Mail, Phone } from 'lucide-react';
import { useState } from 'react';
import { motion } from 'framer-motion';
import Button from '../common/Button.jsx';
import Input from '../common/Input.jsx';

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

const ContactFormModal = ({ isOpen, onClose, onSubmit, initialData = null, isLoading = false }) => {
  const [formErrors, setFormErrors] = useState({});
  const [formData, setFormData] = useState(
    initialData || {
      fullName: '',
      email: '',
      phoneNumber: '',
      relationship: 'friend',
    }
  );

  const validateForm = () => {
    const errors = {};

    if (!formData.fullName.trim()) {
      errors.fullName = 'Full name is required';
    } else if (formData.fullName.trim().length < 2) {
      errors.fullName = 'Name must be at least 2 characters';
    }

    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(formData.email)) {
      errors.email = 'Enter a valid email address';
    }

    if (!formData.phoneNumber?.trim()) {
      errors.phoneNumber = 'Phone number is required';
    }

    if (!formData.relationship) {
      errors.relationship = 'Relationship is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-40 bg-black bg-opacity-50"
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">
              {initialData ? 'Edit Emergency Contact' : 'Add Emergency Contact'}
            </h2>
            <button
              onClick={onClose}
              disabled={isLoading}
              className="text-white hover:bg-primary-700 p-1 rounded transition-colors disabled:opacity-50"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-6 py-6 space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Jane Doe"
                  className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                    formErrors.fullName
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-primary-500'
                  }`}
                />
              </div>
              {formErrors.fullName && (
                <p className="mt-1 text-sm text-red-600">{formErrors.fullName}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="jane@example.com"
                  className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                    formErrors.email
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-primary-500'
                  }`}
                />
              </div>
              {formErrors.email && (
                <p className="mt-1 text-sm text-red-600">{formErrors.email}</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  placeholder="+94701234567"
                  className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                    formErrors.phoneNumber
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-primary-500'
                  }`}
                />
              </div>
              {formErrors.phoneNumber && (
                <p className="mt-1 text-sm text-red-600">{formErrors.phoneNumber}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">Include country code (e.g., +94)</p>
            </div>

            {/* Relationship */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Relationship <span className="text-red-500">*</span>
              </label>
              <select
                name="relationship"
                value={formData.relationship}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                  formErrors.relationship
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-primary-500'
                }`}
              >
                {RELATIONSHIPS.map((rel) => (
                  <option key={rel.value} value={rel.value}>
                    {rel.label}
                  </option>
                ))}
              </select>
              {formErrors.relationship && (
                <p className="mt-1 text-sm text-red-600">{formErrors.relationship}</p>
              )}
            </div>
          </form>

          {/* Actions */}
          <div className="bg-gray-50 px-6 py-4 flex gap-3 border-t border-gray-100">
            <Button
              type="button"
              variant="outline"
              fullWidth
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              fullWidth
              onClick={handleSubmit}
              loading={isLoading}
              disabled={isLoading}
            >
              {initialData ? 'Update' : 'Add'} Contact
            </Button>
          </div>
        </div>
      </motion.div>
    </>
  );
};

export default ContactFormModal;
