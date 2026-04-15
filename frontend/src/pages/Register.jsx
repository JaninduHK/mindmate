import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { FiUser, FiMail, FiLock, FiPhone } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { validateName, validatePhone, validateEmail } from '../utils/emergencyContactValidation';

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

const Register = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { register, isAuthenticated } = useAuth();
  const [invitationToken, setInvitationToken] = useState(null);
  const [isAcceptingInvitation, setIsAcceptingInvitation] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    initialEmergencyContact: {
      fullName: '',
      email: '',
      phoneNumber: '',
      relationship: 'friend',
      enabled: false,
    },
  });
  const [errors, setErrors] = useState({});
  const [emergencyContactErrors, setEmergencyContactErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Extract invitation token from URL
  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      setInvitationToken(token);
      setIsAcceptingInvitation(true);
    }
  }, [searchParams]);

  // Redirect if already authenticated
  if (isAuthenticated) {
    navigate('/dashboard');
    return null;
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleEmergencyContactChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (type === 'checkbox') {
      setFormData((prev) => ({
        ...prev,
        initialEmergencyContact: {
          ...prev.initialEmergencyContact,
          enabled: checked,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        initialEmergencyContact: {
          ...prev.initialEmergencyContact,
          [name]: value,
        },
      }));
    }

    if (emergencyContactErrors[name]) {
      setEmergencyContactErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    } else if (formData.name.trim().length > 50) {
      newErrors.name = 'Name cannot exceed 50 characters';
    }

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(formData.email)) {
      newErrors.email = 'Enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password =
        'Password must contain uppercase, lowercase, and number';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateEmergencyContact = () => {
    if (!formData.initialEmergencyContact.enabled) {
      return true;
    }

    const newErrors = {};
    const ec = formData.initialEmergencyContact;

    newErrors.fullName = validateName(ec.fullName);
    newErrors.phoneNumber = validatePhone(ec.phoneNumber);
    newErrors.email = validateEmail(ec.email);
    if (!ec.relationship) newErrors.relationship = 'Relationship is required';

    setEmergencyContactErrors(newErrors);
    return !Object.values(newErrors).some(err => err !== null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;
    if (!validateEmergencyContact()) return;

    setLoading(true);

    const registerData = {
      name: formData.name,
      email: formData.email,
      password: formData.password,
    };

    // Include invitation token if accepting an emergency contact invitation
    if (invitationToken) {
      registerData.invitationToken = invitationToken;
    }

    if (formData.initialEmergencyContact.enabled) {
      registerData.initialEmergencyContact = {
        fullName: formData.initialEmergencyContact.fullName,
        email: formData.initialEmergencyContact.email,
        phoneNumber: formData.initialEmergencyContact.phoneNumber,
        relationship: formData.initialEmergencyContact.relationship,
      };
    }

    const result = await register(registerData);
    setLoading(false);

    if (result.success) {
      if (result.data?.invitationAccepted?.success) {
        toast.success(`✅ Welcome! You're now a guardian for ${result.data.invitationAccepted.monitoredUser}`);
      }
      navigate('/dashboard');
    } else if (result.error?.invitationStatus?.failed) {
      toast('Account created! Emergency contact invitation could not be sent right now.', { icon: 'ℹ️' });
      setTimeout(() => navigate('/dashboard'), 1500);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-primary-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-3xl">M</span>
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900">
            {isAcceptingInvitation ? 'Accept Guardian Invitation' : 'Create your account'}
          </h2>
          <p className="mt-2 text-gray-600">
            {isAcceptingInvitation 
              ? 'Sign up to accept the emergency contact invitation and monitor user wellness'
              : 'Start your mental wellness journey'}
          </p>
          {isAcceptingInvitation && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                ✅ You've been invited to be an emergency contact. Complete your registration to accept.
              </p>
            </div>
          )}
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Account Info */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Account Information</h3>
              <div className="space-y-4">
                <div className="relative">
                  <FiUser className="absolute left-3 top-10 text-gray-400" />
                  <Input
                    label="Full Name"
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    error={errors.name}
                    required
                    className="pl-10"
                    placeholder="John Doe"
                  />
                </div>

                <div className="relative">
                  <FiMail className="absolute left-3 top-10 text-gray-400" />
                  <Input
                    label="Email Address"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    error={errors.email}
                    required
                    className="pl-10"
                    placeholder="you@example.com"
                  />
                </div>

                <div className="relative">
                  <FiLock className="absolute left-3 top-10 text-gray-400" />
                  <Input
                    label="Password"
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    error={errors.password}
                    required
                    className="pl-10"
                    placeholder="••••••••"
                    helperText="Min 8 chars, with uppercase, lowercase & number"
                  />
                </div>

                <div className="relative">
                  <FiLock className="absolute left-3 top-10 text-gray-400" />
                  <Input
                    label="Confirm Password"
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    error={errors.confirmPassword}
                    required
                    className="pl-10"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>

            {/* Emergency Contact Section */}
            <div className="pt-4 border-t border-gray-200">
              <label className="flex items-center space-x-3 cursor-pointer mb-4">
                <input
                  type="checkbox"
                  checked={formData.initialEmergencyContact.enabled}
                  onChange={handleEmergencyContactChange}
                  className="w-4 h-4 border border-gray-300 rounded focus:ring-2 focus:ring-primary-500"
                />
                <span className="text-sm font-semibold text-gray-900">Add an Emergency Contact</span>
              </label>

              {formData.initialEmergencyContact.enabled && (
                <div className="space-y-4 bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <p className="text-xs text-blue-800 mb-3">
                    Add a trusted person who will be notified during emergencies. You can add more contacts later.
                  </p>

                  {/* Full Name Field */}
                  <div className="relative">
                    <FiUser className="absolute left-3 top-10 text-gray-400" />
                    <Input
                      label="Contact Full Name"
                      type="text"
                      name="fullName"
                      value={formData.initialEmergencyContact.fullName}
                      onChange={handleEmergencyContactChange}
                      error={emergencyContactErrors.fullName}
                      required={formData.initialEmergencyContact.enabled}
                      className={`pl-10 ${
                        emergencyContactErrors.fullName
                          ? 'border-red-500 focus:ring-red-500'
                          : formData.initialEmergencyContact.fullName && !emergencyContactErrors.fullName
                          ? 'border-green-500 focus:ring-green-500'
                          : ''
                      }`}
                      placeholder="Jane Doe"
                      maxLength="30"
                    />
                    {emergencyContactErrors.fullName && (
                      <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                        <span>⚠️</span> {emergencyContactErrors.fullName}
                      </p>
                    )}
                    {formData.initialEmergencyContact.fullName && !emergencyContactErrors.fullName && (
                      <p className="mt-1 text-xs text-green-600 flex items-center gap-1">
                        <span>✓</span> Valid name
                      </p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">
                      {formData.initialEmergencyContact.fullName.length}/30 characters
                    </p>
                  </div>

                  {/* Email Field */}
                  <div className="relative">
                    <FiMail className="absolute left-3 top-10 text-gray-400" />
                    <Input
                      label="Contact Email"
                      type="email"
                      name="email"
                      value={formData.initialEmergencyContact.email}
                      onChange={handleEmergencyContactChange}
                      error={emergencyContactErrors.email}
                      required={formData.initialEmergencyContact.enabled}
                      className={`pl-10 ${
                        emergencyContactErrors.email
                          ? 'border-red-500 focus:ring-red-500'
                          : formData.initialEmergencyContact.email && !emergencyContactErrors.email
                          ? 'border-green-500 focus:ring-green-500'
                          : ''
                      }`}
                      placeholder="jane@example.com"
                      maxLength="50"
                    />
                    {emergencyContactErrors.email && (
                      <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                        <span>⚠️</span> {emergencyContactErrors.email}
                      </p>
                    )}
                    {formData.initialEmergencyContact.email && !emergencyContactErrors.email && (
                      <p className="mt-1 text-xs text-green-600 flex items-center gap-1">
                        <span>✓</span> Valid email
                      </p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">
                      {formData.initialEmergencyContact.email.length}/50 characters
                    </p>
                  </div>

                  {/* Phone Field */}
                  <div className="relative">
                    <FiPhone className="absolute left-3 top-10 text-gray-400" />
                    <Input
                      label="Contact Phone"
                      type="tel"
                      name="phoneNumber"
                      value={formData.initialEmergencyContact.phoneNumber}
                      onChange={handleEmergencyContactChange}
                      error={emergencyContactErrors.phoneNumber}
                      required={formData.initialEmergencyContact.enabled}
                      className={`pl-10 ${
                        emergencyContactErrors.phoneNumber
                          ? 'border-red-500 focus:ring-red-500'
                          : formData.initialEmergencyContact.phoneNumber && !emergencyContactErrors.phoneNumber
                          ? 'border-green-500 focus:ring-green-500'
                          : ''
                      }`}
                      placeholder="+94701234567"
                      helperText="Sri Lankan format: +94XXXXXXXXX or 0XXXXXXXXX"
                    />
                    {emergencyContactErrors.phoneNumber && (
                      <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                        <span>⚠️</span> {emergencyContactErrors.phoneNumber}
                      </p>
                    )}
                    {formData.initialEmergencyContact.phoneNumber && !emergencyContactErrors.phoneNumber && (
                      <p className="mt-1 text-xs text-green-600 flex items-center gap-1">
                        <span>✓</span> Valid phone number
                      </p>
                    )}
                  </div>

                  {/* Relationship Field */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Relationship <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="relationship"
                      value={formData.initialEmergencyContact.relationship}
                      onChange={handleEmergencyContactChange}
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors ${
                        emergencyContactErrors.relationship
                          ? 'border-red-500 focus:ring-red-500'
                          : 'border-gray-300'
                      }`}
                    >
                      {RELATIONSHIPS.map((rel) => (
                        <option key={rel.value} value={rel.value}>
                          {rel.label}
                        </option>
                      ))}
                    </select>
                    {emergencyContactErrors.relationship && (
                      <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                        <span>⚠️</span> {emergencyContactErrors.relationship}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <Button
            type="submit"
            fullWidth
            loading={loading}
            disabled={
              loading ||
              (formData.initialEmergencyContact.enabled &&
                (Object.values(emergencyContactErrors).some(err => err !== null) ||
                  !formData.initialEmergencyContact.fullName ||
                  !formData.initialEmergencyContact.email ||
                  !formData.initialEmergencyContact.phoneNumber))
            }
          >
            Create Account
          </Button>

          <div className="text-center text-sm">
            <span className="text-gray-600">Already have an account? </span>
            <Link
              to="/login"
              className="font-medium text-primary-600 hover:text-primary-500"
            >
              Sign in
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;
