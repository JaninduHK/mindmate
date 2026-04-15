import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { FiMail, FiLock } from 'react-icons/fi';
import { useAuth } from '../hooks/useAuth';

const GuardianLogin = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

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

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(formData.email)) {
      newErrors.email = 'Enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    try {
      const result = await login(formData);
      
      if (result.success) {
        // Successfully logged in
        setTimeout(() => {
          navigate('/guardian-dashboard');
        }, 300);
      } else {
        // Login failed - error toast already shown by AuthContext
        console.error('Login failed:', result.error);
      }
    } catch (err) {
      console.error('Login error:', err);
      // Error already handled by AuthContext toast
    } finally {
      setLoading(false);
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
          <h2 className="text-3xl font-bold text-gray-900">Guardian Access</h2>
          <p className="mt-2 text-gray-600">Sign in as an emergency contact</p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
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
            </div>
          </div>

          <Button
            type="submit"
            fullWidth
            loading={loading}
            disabled={loading}
          >
            Sign In
          </Button>

          <div className="text-center text-sm">
            <span className="text-gray-600">Don't have an account? </span>
            <Link
              to="/register/guardian"
              className="font-medium text-primary-600 hover:text-primary-500"
            >
              Sign up here
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GuardianLogin;
