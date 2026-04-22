import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiSend, FiUsers } from 'react-icons/fi';
import { axiosInstance } from '../../api/axios.config';
import { useAuth } from '../../hooks/useAuth';
import { socket } from '../../socket/socket';

const GroupChatPage = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [group, setGroup] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [isMember, setIsMember] = useState(false);
  const [joiningGroup, setJoiningGroup] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch group details and messages
  useEffect(() => {
    const fetchGroup = async () => {
      try {
        setLoading(true);
        const [groupRes, messagesRes] = await Promise.all([
          axiosInstance.get(`/chats/groups/${groupId}`),
          axiosInstance.get(`/chats/groups/${groupId}/messages`)
        ]);

        console.log('Group fetched:', groupRes.data);
        console.log('Messages fetched:', messagesRes.data);

        setGroup(groupRes.data.data);
        setMessages(messagesRes.data.data || []);

        // Check if user is a member
        const memberIds = groupRes.data.data.members.map(m => m._id || m);
        setIsMember(memberIds.includes(user._id));
      } catch (error) {
        console.error('Failed to fetch group:', error.response?.data || error.message);
      } finally {
        setLoading(false);
      }
    };

    if (groupId) {
      fetchGroup();
    }
  }, [groupId, user._id]);

  // Join group room on socket connection
  useEffect(() => {
    if (isMember && groupId) {
      socket.emit('join_group_room', groupId);
      console.log('Joined group room:', groupId);
    }

    return () => {
      if (groupId) {
        socket.emit('leave_group_room', groupId);
      }
    };
  }, [isMember, groupId]);

  // Listen for incoming group messages
  useEffect(() => {
    const handleReceiveMessage = (data) => {
      console.log('Received message event:', data);
      setMessages(prev => [...prev, {
        _id: data._id,
        senderId: data.senderId,
        message: data.message,
        createdAt: data.createdAt,
        isEdited: data.isEdited,
      }]);
    };

    socket.on('receive_group_message', handleReceiveMessage);

    return () => {
      socket.off('receive_group_message', handleReceiveMessage);
    };
  }, []);

  const handleJoinGroup = async () => {
    try {
      setJoiningGroup(true);
      console.log('Joining group:', groupId);
      const response = await axiosInstance.post(`/chats/groups/${groupId}/join`);
      console.log('Joined group:', response.data);
      setIsMember(true);
    } catch (error) {
      console.error('Failed to join group:', error.response?.data || error.message);
    } finally {
      setJoiningGroup(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!messageInput.trim()) return;

    try {
      const messageData = {
        senderId: user._id,
        groupId,
        message: messageInput,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sender: { name: user.name, avatar: user.avatar },
      };

      console.log('Sending message:', messageData);

      // Emit via socket for real-time delivery
      socket.emit('send_group_message', messageData);
      console.log('Message emitted via socket');
      
      // Also save via API
      const response = await axiosInstance.post(`/chats/groups/${groupId}/send`, {
        message: messageInput,
      });
      console.log('Message saved via API:', response.data);

      setMessageInput('');
    } catch (error) {
      console.error('Failed to send message:', error.response?.data || error.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading group chat...</p>
        </div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md bg-white p-8 rounded-xl shadow-sm border border-gray-100">
          <FiUsers className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Group Not Found</h2>
          <p className="text-gray-600 mb-6">The chat group you are looking for doesn't exist or has been removed.</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 lg:py-6 flex flex-col lg:items-center font-sans">
      <div className="w-full lg:max-w-5xl flex flex-col flex-1 lg:max-h-[calc(100vh-3rem)] bg-white lg:rounded-2xl lg:shadow-md lg:border lg:border-gray-200 overflow-hidden relative">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm z-10 shrink-0">
        <div className="container-custom mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-full transition"
            >
              <FiArrowLeft className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center text-primary-600">
                <FiUsers className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-lg md:text-xl font-bold text-gray-900 leading-tight">{group.name}</h1>
                <p className="text-xs md:text-sm text-gray-500 flex items-center gap-1 font-medium">
                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                  {group.members?.length || 0} members
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Not a member view */}
      {!isMember ? (
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center max-w-md bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
            <div className="w-20 h-20 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-6 text-primary-600">
              <FiUsers className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Join {group.name}</h2>
            <p className="text-gray-600 mb-8 leading-relaxed">
              {group.description || 'Become a member of this community group to start sharing, supporting, and chatting with others.'}
            </p>
            <button
              onClick={handleJoinGroup}
              disabled={joiningGroup}
              className="w-full bg-primary-600 text-white font-medium px-6 py-3.5 rounded-xl hover:bg-primary-700 transition disabled:bg-primary-300 disabled:cursor-not-allowed shadow-md hover:shadow-lg flex justify-center items-center"
            >
              {joiningGroup ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Joining...
                </>
              ) : 'Join Community Group'}
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto bg-[#F0F2F5] px-4 py-6">
            <div className="max-w-4xl mx-auto space-y-6">
              {messages.length === 0 ? (
                <div className="text-center self-center my-12 bg-white/60 p-6 rounded-2xl border border-gray-100 max-w-sm mx-auto">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                    <FiUsers className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-1">It's quiet here...</h3>
                  <p className="text-gray-500 text-sm">Be the first to send a message and start the conversation!</p>
                </div>
              ) : (
                messages.map((msg, index) => {
                  const senderId = typeof msg.senderId === 'object' ? msg.senderId._id : msg.senderId;
                  const senderName = typeof msg.senderId === 'object' ? msg.senderId.name : 'User';
                  const isOwnMessage = senderId === user._id;

                  // Simple grouping logic (if consecutive messages from same user)
                  const prevMsg = index > 0 ? messages[index - 1] : null;
                  const prevSenderId = prevMsg ? (typeof prevMsg.senderId === 'object' ? prevMsg.senderId._id : prevMsg.senderId) : null;
                  const isConsecutive = prevSenderId === senderId;

                  return (
                    <div
                      key={msg._id}
                      className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} ${isConsecutive ? 'mt-1' : 'mt-4'}`}
                    >
                      <div className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'} max-w-[80%] md:max-w-[70%]`}>
                        
                        {!isOwnMessage && !isConsecutive && (
                          <span className="text-xs font-medium text-gray-500 ml-1 mb-1">
                            {senderName}
                          </span>
                        )}
                        
                        <div
                          className={`px-4 py-2.5 shadow-sm text-[15px] leading-relaxed relative
                            ${isOwnMessage
                              ? 'bg-primary-600 text-white rounded-2xl rounded-tr-sm'
                              : 'bg-white text-gray-800 rounded-2xl rounded-tl-sm border border-gray-100'
                            }`}
                        >
                          <span className="break-words">{msg.message}</span>
                          
                          <div className={`mt-1 flex items-center justify-end gap-1 ${isOwnMessage ? 'text-primary-100' : 'text-gray-400'}`}>
                            <span className="text-[10px] font-medium tracking-wide">
                              {new Date(msg.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Message Input */}
          <div className="bg-white border-t border-gray-200 p-4 shrink-0">
            <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto flex items-end gap-3">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder="Type a message..."
                  className="w-full px-5 py-3.5 bg-gray-100/80 border-transparent rounded-full focus:bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all placeholder:text-gray-500"
                />
              </div>
              <button
                type="submit"
                disabled={!messageInput.trim()}
                className="bg-primary-600 text-white p-3.5 rounded-full hover:bg-primary-700 transition-all disabled:bg-gray-300 disabled:text-gray-100 flex items-center justify-center shrink-0 shadow-md hover:shadow-lg disabled:shadow-none"
              >
                <FiSend className="w-5 h-5 ml-1" />
              </button>
            </form>
          </div>
        </>
      )}
      </div>
    </div>
  );
};

export default GroupChatPage;
