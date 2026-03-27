import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ChatBox from "../../components/chat/ChatBox";
import { useAuth } from "../../hooks/useAuth";
import { peerSupporterAPI } from "../../api/peerSupporter.api";
import { FiArrowLeft } from "react-icons/fi";

const ChatPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { recipientId: paramRecipientId } = useParams();
  
  const [recipientId, setRecipientId] = useState(paramRecipientId || "");
  const [startChat, setStartChat] = useState(!!paramRecipientId);
  const [recipientInfo, setRecipientInfo] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch recipient info if coming from peer supporters list
  useEffect(() => {
    if (paramRecipientId && !recipientInfo) {
      setLoading(true);
      peerSupporterAPI.getById(paramRecipientId)
        .then((res) => {
          if (res.success) {
            setRecipientInfo(res.data.profile);
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [paramRecipientId, recipientInfo]);

  const handleStartChat = () => {
    if (!recipientId.trim()) {
      alert("Please enter recipient user ID");
      return;
    }
    setStartChat(true);
  };

  const handleBack = () => {
    setStartChat(false);
    setRecipientId("");
    setRecipientInfo(null);
    navigate("/peer-supporters");
  };

  if (!startChat) {
    return (
      <div className="container-custom py-8 max-w-md">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Start a Chat</h2>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-600">Your ID:</p>
            <p className="font-semibold text-gray-900 mt-1">{user?._id || "Loading..."}</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Recipient User ID</label>
            <input
              type="text"
              placeholder="Enter recipient's user ID"
              value={recipientId}
              onChange={(e) => setRecipientId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            />
          </div>

          <button 
            onClick={handleStartChat}
            className="w-full mt-6 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
          >
            Start Chat
          </button>

          <button
            onClick={() => navigate("/peer-supporters")}
            className="w-full mt-3 bg-gray-200 text-gray-800 py-3 rounded-lg hover:bg-gray-300 transition-colors font-semibold flex items-center justify-center gap-2"
          >
            <FiArrowLeft /> View Peer Supporters
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container-custom py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Chat</h2>
          {recipientInfo && (
            <p className="text-gray-600 text-sm mt-1">Chatting with <span className="font-semibold">{recipientInfo.name}</span></p>
          )}
        </div>
        <button 
          onClick={handleBack}
          className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
        >
          <FiArrowLeft /> Back
        </button>
      </div>
      
      <ChatBox 
        currentUserId={user?._id} 
        recipientId={recipientId}
      />
    </div>
  );
};

export default ChatPage;