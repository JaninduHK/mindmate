import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { FiUser, FiMail, FiLock, FiAlertCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';
import axiosInstance, { setAccessToken } from '../api/axios.config';

const GuardianSignup = () => {
  const navigate = useNavigate();
  const { token } = useParams();
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [isInvitationFlow, setIsInvitationFlow] = useState(!!token);

  // Determine if this is invitation-based or direct signup
  useEffect(() => {
    setIsInvitationFlow(!!token);
  }, [token]);

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

  const validateForm = () => {
    const newErrors = {};

    // Full Name validation
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = 'Name must be at least 2 characters';
    } else if (formData.fullName.trim().length > 60) {
      newErrors.fullName = 'Name cannot exceed 60 characters';
    } else if (!/^[a-zA-Z\s'-]+$/.test(formData.fullName)) {
      newErrors.fullName = 'Name can only contain letters, spaces, hyphens, and apostrophes';
    }

    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(formData.email)) {
      newErrors.email = 'Enter a valid email address';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain uppercase, lowercase, and number';
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;
    
    // If invitation flow, must have token
    if (isInvitationFlow && !token) {
      toast.error('Invalid invitation. Please use the link from the email.');
      return;
    }

    setLoading(true);
    try {
      // Sign up as guardian/emergency contact
      const payload = {
        name: formData.fullName,
        email: formData.email,
        password: formData.password,
      };

      // Only add invitation token if it exists
      if (token) {
        payload.invitationToken = token;
      }

      const response = await axiosInstance.post('/auth/guardian-signup', payload);

      if (response.data.success) {
        toast.success('Account created successfully!');
        
        // Store the access token from signup response
        const { accessToken } = response.data.data;
        if (accessToken) {
          // Store token to localStorage and axios headers
          setAccessToken(accessToken);
          // Navigate immediately - the AuthContext will verify on next app load
          navigate('/guardian-dashboard');
        }
      }
    } catch (error) {
      console.error('Signup error:', error);
      const errorMsg =
        error.response?.data?.message ||
        'Failed to create account. Please try again.';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (!isInvitationFlow && token) {
    // Redirect if somehow has token but shouldn't use it
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-primary-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-3xl">M</span>
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Welcome to MindMate</h2>
          <p className="mt-2 text-gray-600">
            {isInvitationFlow 
              ? 'Create your guardian account' 
              : 'Create your emergency contact account'}
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="relative">
              <FiUser className="absolute left-3 top-10 text-gray-400" />
              <Input
                label="Full Name"
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                error={errors.fullName}
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
              />
              {formData.password && (
                <p className="mt-1 text-xs text-gray-500">
                  Must contain uppercase, lowercase, and number
                </p>
              )}
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

          <Button
            type="submit"
            fullWidth
            loading={loading}
            disabled={loading}
          >
            Create Account
          </Button>

          <div className="text-center text-sm">
            <span className="text-gray-600">Already have an account? </span>
            <Link
              to="/guardian-login"
              className="font-medium text-primary-600 hover:text-primary-500"
            >
              Sign in here
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GuardianSignup;
