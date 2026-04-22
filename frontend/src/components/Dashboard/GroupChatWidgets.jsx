import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiUsers, FiPlus, FiX } from 'react-icons/fi';
import { axiosInstance } from '../../api/axios.config';

const GroupChatWidgets = ({ user }) => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [creating, setCreating] = useState(false);

  const isPeerCounselor = user?.role === 'peer_supporter';

  // Debug logging
  useEffect(() => {
    console.log('GroupChatWidgets - User:', user);
    console.log('GroupChatWidgets - User role:', user?.role);
    console.log('GroupChatWidgets - isPeerCounselor:', isPeerCounselor);
  }, [user, isPeerCounselor]);

  useEffect(() => {
    fetchGroups();
    
    // Auto-refresh groups every 30 seconds
    const interval = setInterval(() => {
      fetchGroups();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/chats/groups/available');
      console.log('Fetched groups:', response.data);
      setGroups(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch group chats:', error.response?.data || error.message);
      setGroups([]);
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
      const response = await axiosInstance.post('/chats/groups', {
        name: groupName.trim()
      });
      console.log('Group created successfully:', response.data);
      setSuccess('Group created successfully!');
      setGroupName('');
      // Close modal and refresh groups after a short delay
      setTimeout(() => {
        setShowModal(false);
        setSuccess('');
        fetchGroups();
      }, 1500);
    } catch (error) {
      console.error('Error creating group:', error.response?.data || error.message);
      const errorMsg = error.response?.data?.message || error.response?.data?.error || error.message || 'Failed to create group';
      setError(errorMsg);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 flex items-center gap-3">
            <div className="p-2.5 bg-primary-50 rounded-xl text-primary-600">
              <FiUsers className="w-6 h-6" />
            </div>
            Community Chat Groups
          </h2>
          <p className="text-gray-500 text-sm mt-1 ml-14">Connect, share, and support each other</p>
        </div>
        {isPeerCounselor && (
          <button
            onClick={() => setShowModal(true)}
            className="w-full md:w-auto bg-primary-600 text-white px-5 py-2.5 rounded-xl hover:bg-primary-700 transition-all flex items-center justify-center gap-2 font-medium shadow-sm hover:shadow-md"
          >
            <FiPlus className="w-5 h-5" /> <span>Create Group</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-10 h-10 border-4 border-gray-200 border-t-primary-600 rounded-full animate-spin mb-4"></div>
          <p className="text-gray-500 font-medium">Loading community groups...</p>
        </div>
      ) : groups.length === 0 ? (
        <div className="text-center py-12 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex flex-col items-center justify-center mx-auto mb-4 text-gray-400">
            <FiUsers className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-1">No Community Groups Yet</h3>
          <p className="text-gray-500 max-w-sm mx-auto">There are no active community groups available right now.</p>
          {isPeerCounselor && (
            <p className="text-primary-600 mt-4 font-medium text-sm">You can be the first to create one using the button above!</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {groups.map((group) => (
            <Link
              key={group._id}
              to={`/chat-group/${group._id}`}
              className="group flex flex-col bg-white border border-gray-100 rounded-2xl p-5 hover:border-primary-200 hover:shadow-md transition-all duration-300 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-primary-400 to-primary-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-primary-50 text-primary-600 rounded-xl group-hover:scale-110 transition-transform">
                  <FiUsers className="w-6 h-6" />
                </div>
                <div className="bg-gray-50 px-3 py-1 rounded-full flex items-center gap-1.5 text-xs font-semibold text-gray-600 border border-gray-100 shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                  {group.members?.length || 0}
                </div>
              </div>
              
              <h3 className="text-lg font-bold text-gray-900 mb-1 line-clamp-1 group-hover:text-primary-700 transition-colors">
                {group.name}
              </h3>
              
              <p className="text-sm text-gray-500 mb-4 line-clamp-2 leading-relaxed">
                {group.description || 'Join this community group to connect and chat.'}
              </p>
              
              <div className="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between">
                <div className="text-xs text-gray-400">
                  Created by <span className="font-medium text-gray-600">{group.creatorId?.name || 'A Peer Counselor'}</span>
                </div>
                <div className="text-primary-600 font-medium text-sm group-hover:translate-x-1 transition-transform flex items-center gap-1">
                  Join <span className="text-lg leading-none">→</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Create Group Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden translate-y-0 animate-in slide-in-from-bottom-4 duration-300">
            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <FiUsers className="text-primary-600" /> Create Community Group
              </h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  setGroupName('');
                  setError('');
                  setSuccess('');
                }}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              {error && (
                <div className="mb-5 p-3.5 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm flex items-start gap-2">
                  <span className="text-lg leading-none mt-0.5">!</span> {error}
                </div>
              )}

              {success && (
                <div className="mb-5 p-3.5 bg-green-50 border border-green-100 rounded-xl text-green-600 text-sm flex items-start gap-2 font-medium">
                  <span className="text-lg leading-none mt-0.5">✓</span> {success}
                </div>
              )}

              <form onSubmit={handleCreateGroup}>
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Group Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-shadow bg-gray-50/50 focus:bg-white"
                    placeholder="e.g., Managing Anxiety Tools"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    disabled={creating}
                    autoFocus
                  />
                  <p className="text-xs text-gray-500 mt-2 ml-1">Make the name clear and welcoming so others know what the group is about.</p>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setGroupName('');
                      setError('');
                      setSuccess('');
                    }}
                    className="px-5 py-2.5 rounded-xl text-gray-600 font-medium hover:bg-gray-100 transition-colors"
                    disabled={creating}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition-all disabled:bg-primary-300 disabled:cursor-not-allowed shadow-sm hover:shadow-md disabled:shadow-none flex items-center justify-center gap-2"
                    disabled={creating || !groupName.trim()}
                  >
                    {creating ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/80 border-t-transparent rounded-full animate-spin"></div>
                        Creating...
                      </>
                    ) : 'Create Group'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupChatWidgets;
