import { useState } from "react";
import ChatBox from "../../components/chat/ChatBox";
import { useAuth } from "../../hooks/useAuth";

const ChatPage = () => {
  const { user } = useAuth(); // Get logged-in user
  const [recipientId, setRecipientId] = useState("");
  const [startChat, setStartChat] = useState(false);

  const handleStartChat = () => {
    if (!recipientId.trim()) {
      alert("Please enter recipient user ID");
      return;
    }
    setStartChat(true);
  };

  if (!startChat) {
    return (
      <div style={{ padding: "20px", maxWidth: "400px", margin: "auto" }}>
        <h2>Start a Chat</h2>
        <p>Your ID: <strong>{user?._id || "Loading..."}</strong></p>
        <input
          type="text"
          placeholder="Enter recipient's user ID"
          value={recipientId}
          onChange={(e) => setRecipientId(e.target.value)}
          style={{ width: "100%", padding: "8px", marginBottom: "10px" }}
        />
        <button 
          onClick={handleStartChat}
          style={{ width: "100%", padding: "10px", backgroundColor: "#007bff", color: "white", border: "none", cursor: "pointer" }}
        >
          Start Chat
        </button>
      </div>
    );
  }

  return (
    <div>
      <h2>Peer Support Chat</h2>
      <button 
        onClick={() => setStartChat(false)}
        style={{ marginBottom: "10px", padding: "8px 16px", cursor: "pointer" }}
      >
        ← Back
      </button>
      <ChatBox 
        currentUserId={user?._id} 
        recipientId={recipientId}
      />
    </div>
  );
};

export default ChatPage;