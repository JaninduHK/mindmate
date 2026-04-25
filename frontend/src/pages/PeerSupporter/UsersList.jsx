import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { userAPI } from '../../api/user.api';
import { chatAPI } from '../../api/chat.api';
import { socket } from '../../socket/socket';
import { useAuth } from '../../hooks/useAuth';
import Loading from '../../components/common/Loading';
import { FiMessageCircle, FiArrowLeft, FiX, FiBell } from 'react-icons/fi';

const UsersList = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [unreadSenders, setUnreadSenders] = useState({});

  useEffect(() => {
    const fetchUnread = async () => {
      if (currentUser) {
        try {
          const res = await chatAPI.getConversations(currentUser._id);
          console.log("Conversations response:", res);
          if (res.success && res.data && res.data.conversations) {
            const unread = {};
            res.data.conversations.forEach(c => {
              if (c.lastMessage && c.lastMessage.recipientId === currentUser._id && !c.lastMessage.readAt) {
                console.log("Marking as unread from sender:", c.lastMessage.senderId);
                unread[c.lastMessage.senderId] = true;
              }
            });
            console.log("Final unread map:", unread);
            setUnreadSenders(unread);
          }
        } catch (error) {
          console.error("Error fetching unread messages:", error);
        }
      }
    };
    fetchUnread();
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      socket.emit("join_room", currentUser._id);
      
      const handleReceive = (data) => {
        console.log("Received message for users list:", data);
        // Only mark as unread if this is an incoming message (not sent by current user)
        if (data.recipientId === currentUser._id && data.senderId !== currentUser._id) {
          console.log("Adding unread notification for user:", data.senderId);
          setUnreadSenders(prev => ({ ...prev, [data.senderId]: true }));
        }
      };

      socket.on("receive_message", handleReceive);

      return () => {
        socket.off("receive_message", handleReceive);
      };
    }
  }, [currentUser]);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await userAPI.getUsers({ page, limit: 12 });
        if (res.success) {
          setUsers(res.data.users);
          setTotalPages(res.data.pages);
        }
      } catch {}
      setLoading(false);
    };
    fetch();
  }, [page]);

  const handleHelpClick = (userId) => {
    navigate(`/chat/${userId}`);
  };

  return (
    <div className="container-custom py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">People Needing Support</h1>
          <p className="text-gray-600 mt-2">Connect with users who need your support</p>
        </div>
        <button
          onClick={() => navigate('/peer-supporter/dashboard')}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-semibold text-sm"
        >
          <FiArrowLeft /> Back to Dashboard
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loading /></div>
      ) : users.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-400 text-lg">No users available at this time</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {users.map((user) => {
              const displayUsername = user.username || `User #${user._id ? user._id.substring(user._id.length - 6).toUpperCase() : 'UNKNOWN'}`;
              
              return (
              <div key={user._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                <div className="p-6">
                  <div className="flex items-center justify-center mb-4">
                    {user.avatar?.url ? (
                      <img
                        src={user.avatar.url}
                        alt={displayUsername}
                        className="w-20 h-20 rounded-full object-cover border-4 border-primary-50"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-primary-100 flex items-center justify-center text-2xl font-bold text-primary-600">
                        {displayUsername[0]?.toUpperCase() || 'U'}
                      </div>
                    )}
                  </div>
                  
                  <div className="text-center mb-5">
                    <h3 className="font-semibold text-xl text-gray-900">{displayUsername}</h3>
                    <div className="mt-3 inline-block bg-primary-50 text-primary-700 px-3 py-1.5 rounded-full text-xs font-semibold">
                      Needs Support
                    </div>
                  </div>

                  <button
                    onClick={() => handleHelpClick(user._id)}
                    className="w-full bg-primary-600 text-white py-2.5 rounded-xl hover:bg-primary-700 transition-colors font-semibold flex items-center justify-center gap-2 text-sm relative"
                  >
                    <FiMessageCircle className="w-4.5 h-4.5" />
                    Offer Help
                    {unreadSenders[user._id] && (
                      <span className="absolute -top-1 -right-1 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                      </span>
                    )}
                  </button>
                </div>
              </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center items-center space-x-4 mt-10">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-5 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 disabled:opacity-40 hover:bg-gray-50 transition-colors"
              >
                Previous
              </button>
              <span className="text-sm text-gray-500 font-medium">Page {page} of {totalPages}</span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-5 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 disabled:opacity-40 hover:bg-gray-50 transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default UsersList;
