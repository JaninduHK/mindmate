import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { userAPI } from '../../api/user.api';
import { FiCheckCircle, FiXCircle, FiClock } from 'react-icons/fi';
import toast from 'react-hot-toast';

const AvailabilityToggle = ({ isAvailableNow, onStatusChange }) => {
  const { user } = useAuth();
  const [isAvailable, setIsAvailable] = useState(isAvailableNow || false);
  const [loading, setLoading] = useState(false);

  // Update local state when prop changes
  useEffect(() => {
    setIsAvailable(isAvailableNow || false);
  }, [isAvailableNow]);

  const handleToggle = async () => {
    setLoading(true);
    try {
      const res = await userAPI.toggleAvailability();
      if (res.success) {
        setIsAvailable(res.data.isAvailableNow);
        toast.success(res.data.message);
        if (onStatusChange) {
          onStatusChange(res.data.isAvailableNow);
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update availability');
    } finally {
      setLoading(false);
    }
  };

  if (user?.role !== 'peer_supporter') {
    return null;
  }

  return (
    <div className="flex items-center gap-3 p-4 bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="flex-1">
        <h3 className="font-semibold text-gray-900">Current Status</h3>
        <p className="text-sm text-gray-600 mt-1">
          {isAvailable ? 'You are available for chats' : 'You are currently offline'}
        </p>
      </div>

      <button
        onClick={handleToggle}
        disabled={loading}
        className={`relative inline-flex items-center h-10 w-16 rounded-full transition-colors ${
          isAvailable ? 'bg-green-500' : 'bg-gray-300'
        } ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <span
          className={`inline-block h-8 w-8 transform rounded-full bg-white transition-transform ${
            isAvailable ? 'translate-x-8' : 'translate-x-1'
          }`}
        />
      </button>

      <div className="flex items-center gap-2 ml-2">
        {isAvailable ? (
          <FiCheckCircle className="w-5 h-5 text-green-600" />
        ) : (
          <FiXCircle className="w-5 h-5 text-gray-400" />
        )}
      </div>
    </div>
  );
};

export default AvailabilityToggle;
