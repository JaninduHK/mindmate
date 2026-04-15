import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, User, Mail, Phone, Users } from 'lucide-react';
import Button from '../../common/Button.jsx';
import Input from '../../common/Input.jsx';
import { validateName, validatePhone, validateEmail } from '../../../utils/emergencyContactValidation.js';

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

const Backdrop = ({ onClick }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    onClick={onClick}
    className="fixed inset-0 bg-black/50 z-40"
  />
);

const ContactFormModal = ({ isOpen, onClose, onSubmit, initialData, isLoading }) => {
  const isEditing = !!initialData;
  const [formData, setFormData] = useState({
    fullName: initialData?.fullName || '',
    email: initialData?.email || '',
    phoneNumber: initialData?.phoneNumber || '',
    relationship: initialData?.relationship || 'friend',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        fullName: initialData.fullName || '',
        email: initialData.email || '',
        phoneNumber: initialData.phoneNumber || '',
        relationship: initialData.relationship || 'friend',
      });
      setErrors({});
    } else {
      setFormData({
        fullName: '',
        email: '',
        phoneNumber: '',
        relationship: 'friend',
      });
      setErrors({});
    }
  }, [initialData, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    newErrors.fullName = validateName(formData.fullName);
    newErrors.phoneNumber = validatePhone(formData.phoneNumber);
    newErrors.email = validateEmail(formData.email);
    if (!formData.relationship) newErrors.relationship = 'Relationship is required';

    setErrors(newErrors);
    return !Object.values(newErrors).some(err => err !== null);
  };

  const handleSubmitForm = (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    onSubmit(formData);
    setFormData({
      fullName: '',
      email: '',
      phoneNumber: '',
      relationship: 'friend',
    });
    setErrors({});
  };

  if (!isOpen) return null;

  return (
    <>
      <Backdrop onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="fixed inset-0 flex items-center justify-center z-50 p-4"
      >
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white px-6 py-4 flex items-center justify-between">
            <h2 className="text-lg font-bold">
              {isEditing ? 'Edit Emergency Contact' : 'Add Emergency Contact'}
            </h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-primary-700 rounded transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmitForm} className="p-6 space-y-4">
            {/* Full Name */}
            <div className="relative">
              <User className="absolute left-3 top-10 text-gray-400" />
              <Input
                label="Full Name"
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                error={errors.fullName}
                className="pl-10"
                placeholder="Jane Doe"
                disabled={isLoading}
              />
            </div>

            {/* Email */}
            <div className="relative">
              <Mail className="absolute left-3 top-10 text-gray-400" />
              <Input
                label="Email Address"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                error={errors.email}
                className="pl-10"
                placeholder="jane@example.com"
                disabled={isLoading}
              />
            </div>

            {/* Phone */}
            <div className="relative">
              <Phone className="absolute left-3 top-10 text-gray-400" />
              <Input
                label="Phone Number"
                type="tel"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                error={errors.phoneNumber}
                helperText="Include country code (e.g., +94701234567)"
                className="pl-10"
                placeholder="+94701234567"
                disabled={isLoading}
              />
            </div>

            {/* Relationship */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Relationship <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Users className="absolute left-3 top-2 text-gray-400 w-5 h-5 pointer-events-none" />
                <select
                  name="relationship"
                  value={formData.relationship}
                  onChange={handleChange}
                  disabled={isLoading}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
                >
                  {RELATIONSHIPS.map((rel) => (
                    <option key={rel.value} value={rel.value}>
                      {rel.label}
                    </option>
                  ))}
                </select>
                {errors.relationship && (
                  <p className="text-red-500 text-sm mt-1">{errors.relationship}</p>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
                fullWidth
              >
                Cancel
              </Button>
              <Button
                type="submit"
                loading={isLoading}
                disabled={isLoading}
                fullWidth
              >
                {isEditing ? 'Update' : 'Add'} Contact
              </Button>
            </div>
          </form>
        </div>
      </motion.div>
    </>
  );
};

export default ContactFormModal;
