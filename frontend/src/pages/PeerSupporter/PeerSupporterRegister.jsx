import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { FiUser, FiMail, FiLock } from 'react-icons/fi';

const PeerSupporterRegister = () => {
  const navigate = useNavigate();
  const { registerPeerSupporter, isAuthenticated } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) {
    navigate('/peer-supporter/dashboard');
    return null;
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
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
      newErrors.password = 'Password must contain uppercase, lowercase, and number';
    }

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

    setLoading(true);
    const result = await registerPeerSupporter({
      name: formData.name,
      email: formData.email,
      password: formData.password,
    });
    setLoading(false);

    if (result.success) {
      navigate('/peer-supporter/dashboard');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-teal-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-3xl">M</span>
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Join as Peer Counselor</h2>
          <p className="mt-2 text-gray-600">Help others on their mental wellness journey</p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
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

          <Button type="submit" fullWidth loading={loading} disabled={loading}>
            Create Peer Counselor Account
          </Button>

          <div className="text-center text-sm space-y-2">
            <div>
              <span className="text-gray-600">Already have an account? </span>
              <Link to="/login" className="font-medium text-teal-600 hover:text-teal-500">
                Sign in
              </Link>
            </div>
            <div>
              <span className="text-gray-600">Registering as a user? </span>
              <Link to="/register" className="font-medium text-primary-600 hover:text-primary-500">
                User registration
              </Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PeerSupporterRegister;
