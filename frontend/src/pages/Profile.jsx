import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { userAPI } from '../api/user.api';
import { uploadAPI } from '../api/upload.api';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import toast from 'react-hot-toast';
import { FiCamera, FiSave, FiToggleRight } from 'react-icons/fi';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
  });
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Settings state
  const [settings, setSettings] = useState({
    gpsEnabled: user?.settings?.gpsEnabled ?? true,
    emailAlerts: user?.settings?.emailAlerts ?? true,
    smsAlerts: user?.settings?.smsAlerts ?? true,
    pushAlerts: user?.settings?.pushAlerts ?? true,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleToggleSetting = (key) => {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
    toast.success('Setting updated');
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    const trimmedName = formData.name.trim();
    if (!trimmedName) {
      toast.error('Name is required');
      return;
    }
    if (trimmedName.length < 2) {
      toast.error('Name must be at least 2 characters');
      return;
    }
    if (trimmedName.length > 50) {
      toast.error('Name cannot exceed 50 characters');
      return;
    }
    setLoading(true);

    try {
      const response = await userAPI.updateProfile({ ...formData, name: trimmedName });
      if (response.success) {
        updateUser(response.data.user);
        toast.success(response.message || 'Profile updated successfully');
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update profile';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    setUploadingImage(true);

    try {
      const response = await uploadAPI.uploadImage(file);
      if (response.success) {
        updateUser({ avatar: response.data.avatar });
        toast.success('Profile image updated successfully');
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to upload image';
      toast.error(message);
    } finally {
      setUploadingImage(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container-custom max-w-2xl">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Profile Settings</h1>

        {/* Profile Image */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Profile Picture
          </h2>
          <div className="flex items-center space-x-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-primary-100 flex items-center justify-center overflow-hidden">
                {user?.avatar?.url ? (
                  <img
                    src={user.avatar.url}
                    alt={user.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-3xl font-bold text-primary-600">
                    {user?.name?.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <label
                htmlFor="avatar-upload"
                className="absolute bottom-0 right-0 bg-primary-600 text-white p-2 rounded-full cursor-pointer hover:bg-primary-700 transition-colors"
              >
                {uploadingImage ? (
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                ) : (
                  <FiCamera className="w-4 h-4" />
                )}
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploadingImage}
                  className="hidden"
                />
              </label>
            </div>
            <div>
              <p className="text-sm text-gray-600">
                Click the camera icon to upload a new photo
              </p>
              <p className="text-xs text-gray-500 mt-1">
                JPG, PNG or WEBP. Max size 5MB.
              </p>
            </div>
          </div>
        </div>

        {/* Profile Information */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Personal Information
          </h2>
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <Input
              label="Full Name"
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />

            <Input
              label="Email Address"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              helperText="Contact support to change your email address"
              disabled
            />

            <div className="pt-4">
              <Button
                type="submit"
                loading={loading}
                disabled={loading}
                className="flex items-center space-x-2"
              >
                <FiSave />
                <span>Save Changes</span>
              </Button>
            </div>
          </form>
        </div>

        {/* Account Information */}
        <div className="bg-white rounded-lg shadow p-6 mt-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Account Information
          </h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Member since:</span>
              <span className="font-medium">
                {new Date(user?.createdAt).toLocaleDateString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Account status:</span>
              <span className="font-medium text-green-600">Active</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Email verified:</span>
              <span className="font-medium">
                {user?.isEmailVerified ? (
                  <span className="text-green-600">Yes</span>
                ) : (
                  <span className="text-yellow-600">Pending</span>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Emergency Settings */}
        <div className="bg-white rounded-lg shadow p-6 mt-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            🚨 Emergency Settings
          </h2>
          <p className="text-sm text-gray-600 mb-6">
            Configure how you receive emergency alerts and location sharing
          </p>

          <div className="space-y-4">
            {/* GPS Toggle */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">GPS Location Sharing</p>
                <p className="text-xs text-gray-600 mt-1">
                  Share your real-time location when emergency mode is activated
                </p>
              </div>
              <button
                onClick={() => handleToggleSetting('gpsEnabled')}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                  settings.gpsEnabled ? 'bg-green-500' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                    settings.gpsEnabled ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Email Alerts Toggle */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Email Alerts</p>
                <p className="text-xs text-gray-600 mt-1">
                  Receive emergency alerts via email
                </p>
              </div>
              <button
                onClick={() => handleToggleSetting('emailAlerts')}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                  settings.emailAlerts ? 'bg-green-500' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                    settings.emailAlerts ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* SMS Alerts Toggle */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">SMS Alerts</p>
                <p className="text-xs text-gray-600 mt-1">
                  Receive emergency alerts via SMS text message
                </p>
              </div>
              <button
                onClick={() => handleToggleSetting('smsAlerts')}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                  settings.smsAlerts ? 'bg-green-500' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                    settings.smsAlerts ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Push Alerts Toggle */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Push Notifications</p>
                <p className="text-xs text-gray-600 mt-1">
                  Receive push notifications for emergency updates
                </p>
              </div>
              <button
                onClick={() => handleToggleSetting('pushAlerts')}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                  settings.pushAlerts ? 'bg-green-500' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                    settings.pushAlerts ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
