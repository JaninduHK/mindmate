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
          <p className="text-gray-600">Loading group chat...</p>
        </div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Group not found</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="text-primary-600 hover:text-primary-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="container-custom py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <FiArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{group.name}</h1>
              <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                <FiUsers className="w-4 h-4" /> {group.members?.length || 0} members
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Not a member view */}
      {!isMember ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md">
            <FiUsers className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Join Group Chat</h2>
            <p className="text-gray-600 mb-6">
              {group.description || 'Join this community group to start chatting with others.'}
            </p>
            <button
              onClick={handleJoinGroup}
              disabled={joiningGroup}
              className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition disabled:bg-primary-400"
            >
              {joiningGroup ? 'Joining...' : 'Join Group'}
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto bg-gray-50">
            <div className="container-custom py-6 space-y-4">
              {messages.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">No messages yet. Start the conversation!</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const senderId = typeof msg.senderId === 'object' ? msg.senderId._id : msg.senderId;
                  const senderName = typeof msg.senderId === 'object' ? msg.senderId.name : 'User';
                  const isOwnMessage = senderId === user._id;

                  return (
                    <div
                      key={msg._id}
                      className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          isOwnMessage
                            ? 'bg-primary-600 text-white'
                            : 'bg-white border border-gray-200 text-gray-900'
                        }`}
                      >
                        {!isOwnMessage && (
                          <p className="text-xs font-semibold mb-1 opacity-75">
                            {senderName}
                          </p>
                        )}
                        <p className="break-words">{msg.message}</p>
                        <p
                          className={`text-xs mt-1 ${
                            isOwnMessage ? 'text-white/70' : 'text-gray-500'
                          }`}
                        >
                          {new Date(msg.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Message Input */}
          <div className="bg-white border-t border-gray-200 p-4">
            <form onSubmit={handleSendMessage} className="container-custom flex gap-3">
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <button
                type="submit"
                disabled={!messageInput.trim()}
                className="bg-primary-600 text-white p-2 rounded-lg hover:bg-primary-700 transition disabled:bg-gray-400 flex items-center justify-center w-10 h-10"
              >
                <FiSend className="w-5 h-5" />
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
};

export default GroupChatPage;
