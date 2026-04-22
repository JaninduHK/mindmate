import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiUsers, FiPlus, FiX } from 'react-icons/fi';
import axios from 'axios';

const GroupChatWidgets = ({ user }) => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [creating, setCreating] = useState(false);

  const isPeerCounselor = user?.role === 'peer_supporter';

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/chats/groups/available');
      setGroups(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch group chats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!groupName.trim()) {
      setError('Group name is required');
      return;
    }

    try {
      setCreating(true);
      await axios.post('/api/chats/groups', {
        name: groupName.trim()
      });
      setSuccess('Group created successfully!');
      setGroupName('');
      setTimeout(() => {
        setShowModal(false);
        fetchGroups();
      }, 1500);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to create group');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <FiUsers className="text-primary-600" /> Community Chat Groups
        </h2>
        {isPeerCounselor && (
          <button
            onClick={() => setShowModal(true)}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition flex items-center gap-2"
          >
            <FiPlus size={18} /> Create Group
          </button>
        )}
      </div>

      {loading ? (
        <p className="text-gray-500 text-center py-4">Loading groups...</p>
      ) : groups.length === 0 ? (
        <p className="text-gray-500 text-center py-4 italic">No active community groups available right now.</p>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.map((group) => (
            <div 
              key={group._id} 
              className="border border-gray-200 p-4 rounded-lg bg-gradient-to-br from-gray-50 to-white hover:shadow-md hover:border-primary-300 transition"
            >
              <h3 className="font-semibold text-gray-800 text-base">{group.name}</h3>
              {group.description && (
                <p className="text-sm text-gray-600 line-clamp-2 mt-2">{group.description}</p>
              )}
              <p className="text-xs text-gray-500 mt-2">
                Created by {group.creatorId?.name || 'Unknown'}
              </p>
              <div className="mt-4 flex justify-between items-center">
                <span className="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded">
                  {group.members?.length || 0} members
                </span>
                <Link 
                  to={`/chat-group/${group._id}`} 
                  className="text-primary-600 text-sm font-medium hover:text-primary-700 transition"
                >
                  Join Chat →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Group Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">Create New Group Chat</h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  setGroupName('');
                  setError('');
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <FiX size={24} />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded text-green-700 text-sm">
                {success}
              </div>
            )}

            <form onSubmit={handleCreateGroup}>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Group Name
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="e.g., Anxiety Support Group"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  disabled={creating}
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setGroupName('');
                    setError('');
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition"
                  disabled={creating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition disabled:bg-primary-400"
                  disabled={creating}
                >
                  {creating ? 'Creating...' : 'Create Group'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupChatWidgets;
