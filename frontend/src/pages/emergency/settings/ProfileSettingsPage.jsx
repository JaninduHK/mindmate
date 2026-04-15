import { useState } from 'react';
import { Helmet } from 'react-helmet';
import { MapPin, Mail, Smartphone, Info, ShieldCheck } from 'lucide-react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { settingsAPI } from '../../../api/emergency/settings.api.js';
import Button from '../../../components/common/Button.jsx';
import toast from 'react-hot-toast';

const ProfileSettingsPage = () => {
  const [preferences, setPreferences] = useState({
    gpsEnabled: false,
    alertChannels: {
      email: true,
      sms: false,
    },
  });

  // Fetch preferences
  const { isLoading: isLoadingPreferences } = useQuery({
    queryKey: ['userPreferences'],
    queryFn: () => settingsAPI.getPreferences(),
    onSuccess: (response) => {
      setPreferences(response.data || preferences);
    },
    onError: (error) => {
      console.error('Failed to load preferences:', error);
    },
  });

  // Update preferences mutation
  const updateMutation = useMutation({
    mutationFn: (newPreferences) => settingsAPI.updatePreferences(newPreferences),
    onSuccess: () => {
      toast.success('Preferences updated successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update preferences');
    },
  });

  const handleToggle = (path) => {
    let newPreferences = { ...preferences };

    if (path === 'gpsEnabled') {
      newPreferences.gpsEnabled = !preferences.gpsEnabled;
    } else if (path.startsWith('alertChannels.')) {
      const channel = path.split('.')[1];
      newPreferences = {
        ...newPreferences,
        alertChannels: {
          ...newPreferences.alertChannels,
          [channel]: !preferences.alertChannels[channel],
        },
      };
    }

    setPreferences(newPreferences);
    updateMutation.mutate(newPreferences);
  };

  return (
    <>
      <Helmet>
        <title>Settings - MindMate</title>
      </Helmet>

      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container-custom max-w-2xl">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
            <p className="text-gray-600 mt-2">
              Manage your privacy and notification preferences
            </p>
          </div>

          {isLoadingPreferences ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Location & Privacy Card */}
              <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-lg font-semibold text-gray-900 mb-2">
                      Location & Privacy
                    </h2>
                    <p className="text-sm text-gray-600 mb-4">
                      Control when your location is shared with emergency contacts
                    </p>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">GPS Location Sharing</p>
                          <p className="text-xs text-gray-500 mt-1">
                            Location is shared only when you activate emergency mode
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={preferences.gpsEnabled}
                            onChange={() => handleToggle('gpsEnabled')}
                            className="sr-only peer"
                            disabled={updateMutation.isPending}
                          />
                          <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>

                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <p className="text-xs text-blue-800">
                          📍 <strong>Privacy Note:</strong> Your location is never stored or shared without your explicit action. Location data is only sent to your emergency contacts during active emergency mode.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Alert Preferences Card */}
              <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Smartphone className="w-6 h-6 text-teal-600" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-lg font-semibold text-gray-900 mb-2">
                      Alert Preferences
                    </h2>
                    <p className="text-sm text-gray-600 mb-4">
                      Choose how you want to receive notifications
                    </p>

                    <div className="space-y-3">
                      {/* Email toggle */}
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Mail className="w-4 h-4 text-gray-400" />
                          <div>
                            <p className="font-medium text-gray-900">Email Alerts</p>
                            <p className="text-xs text-gray-500">
                              Receive notifications via email
                            </p>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={preferences.alertChannels.email}
                            onChange={() => handleToggle('alertChannels.email')}
                            className="sr-only peer"
                            disabled={updateMutation.isPending}
                          />
                          <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                        </label>
                      </div>

                      {/* SMS toggle */}
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Smartphone className="w-4 h-4 text-gray-400" />
                          <div>
                            <p className="font-medium text-gray-900">SMS Alerts</p>
                            <p className="text-xs text-gray-500">
                              Receive notifications via text message
                            </p>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={preferences.alertChannels.sms}
                            onChange={() => handleToggle('alertChannels.sms')}
                            className="sr-only peer"
                            disabled={updateMutation.isPending}
                          />
                          <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Safety Information Card */}
              <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <ShieldCheck className="w-6 h-6 text-red-600" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-lg font-semibold text-gray-900 mb-2">
                      Emergency Help
                    </h2>
                    <p className="text-sm text-gray-600 mb-4">
                      If you are in immediate danger, please contact emergency services directly.
                    </p>

                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <p className="text-sm text-red-900 font-semibold mb-3">
                        Call Emergency Services (911 or your local number)
                      </p>
                      <p className="text-sm text-red-800">
                        Never hesitate to call for emergency help. The MindMate emergency button is a supplement to professional emergency services, not a replacement.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-900 mb-1">
                    Your Privacy Matters
                  </p>
                  <p className="text-sm text-blue-800">
                    All your preferences are private and secure. We never share your data without your explicit consent.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ProfileSettingsPage;