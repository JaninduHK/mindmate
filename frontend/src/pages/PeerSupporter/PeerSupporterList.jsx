import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { peerSupporterAPI } from '../../api/peerSupporter.api';
import { chatAPI } from '../../api/chat.api';
import { socket } from '../../socket/socket';
import { useAuth } from '../../hooks/useAuth';
import Loading from '../../components/common/Loading';
import { FiMessageCircle, FiCheck, FiX, FiRefreshCw, FiBell } from 'react-icons/fi';
import toast from 'react-hot-toast';

const PeerSupporterList = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [peerSupporters, setPeerSupporters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
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
        console.log("Received message for peer supporter list:", data);
        // Only mark as unread if this is an incoming message (not sent by current user)
        if (data.recipientId === currentUser._id && data.senderId !== currentUser._id) {
          console.log("Adding unread notification from:", data.senderId);
          setUnreadSenders(prev => ({ ...prev, [data.senderId]: true }));
        }
      };

      socket.on("receive_message", handleReceive);

      return () => {
        socket.off("receive_message", handleReceive);
      };
    }
  }, [currentUser]);

  const fetchPeerSupporters = async (pageNum = 1, showLoading = true) => {
    if (showLoading) setLoading(true);
    else setRefreshing(true);
    
    try {
      const res = await peerSupporterAPI.list({ page: pageNum, limit: 12 });
      if (res.success) {
        setPeerSupporters(res.data.peerSupporters);
        setTotalPages(res.data.pages);
      }
    } catch {
      toast.error('Failed to load peer supporters');
    } finally {
      if (showLoading) setLoading(false);
      else setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPeerSupporters(page, true);
  }, [page]);

  // Auto-refresh every 30 seconds to check availability updates
  useEffect(() => {
    const interval = setInterval(() => {
      fetchPeerSupporters(page, false);
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [page]);

  const handleChatClick = (supporterId, isAvailable) => {
    if (!isAvailable) {
      toast.error('This peer counselor is currently unavailable. Please try again later.');
      return;
    }
    navigate(`/chat/${supporterId}`);
  };

  const handleManualRefresh = async () => {
    await fetchPeerSupporters(page, false);
    toast.success('List refreshed');
  };

  return (
    <div className="container-custom py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Find a Peer Counselor</h1>
          <p className="text-gray-600 mt-2">Chat with an available peer counselor or schedule a session</p>
        </div>
        <button
          onClick={handleManualRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-primary-50 text-primary-700 rounded-xl hover:bg-primary-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-sm"
        >
          <FiRefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loading /></div>
      ) : peerSupporters.length === 0 ? (
        <div className="text-center py-16 text-gray-400">No peer counselors found</div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {peerSupporters.map((ps) => (
              <div key={ps._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                <div className="p-6">
                  <div className="flex items-center justify-center mb-4">
                    {ps.avatar?.url ? (
                      <img
                        src={ps.avatar.url}
                        alt={ps.name}
                        className="w-20 h-20 rounded-full object-cover border-4 border-primary-50"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-primary-100 flex items-center justify-center text-2xl font-bold text-primary-600">
                        {ps.name?.[0]}
                      </div>
                    )}
                  </div>
                  
                  <div className="text-center mb-4">
                    <h3 className="font-semibold text-lg text-gray-900">{ps.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">{ps.email}</p>
                    <div className="mt-3 inline-block bg-primary-50 text-primary-700 px-3 py-1.5 rounded-full text-xs font-semibold">
                      Peer Counselor
                    </div>
                  </div>

                  {/* Availability Status */}
                  <div className="mb-5">
                    {ps.isAvailableNow ? (
                      <div className="flex items-center justify-center gap-2 text-green-700 font-medium text-sm bg-green-50 py-2 rounded-xl">
                        <FiCheck className="w-4 h-4" />
                        Available Now
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2 text-gray-500 font-medium text-sm bg-gray-50 py-2 rounded-xl">
                        <FiX className="w-4 h-4" />
                        Offline
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => handleChatClick(ps._id, ps.isAvailableNow)}
                    disabled={!ps.isAvailableNow}
                    className={`w-full py-2.5 rounded-xl transition-colors font-semibold flex items-center justify-center gap-2 text-sm relative ${
                      ps.isAvailableNow
                        ? 'bg-primary-600 text-white hover:bg-primary-700'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <FiMessageCircle className="w-4.5 h-4.5" />
                    Chat Now
                    {unreadSenders[ps._id] && (
                      <span className="absolute -top-1 -right-1 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                      </span>
                    )}
                  </button>
                </div>
              </div>
            ))}
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

export default PeerSupporterList;
