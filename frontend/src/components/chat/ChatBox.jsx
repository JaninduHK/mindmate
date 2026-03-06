import { useEffect, useState } from "react";
import { socket } from "../../socket/socket";

const ChatBox = ({ currentUserId, recipientId }) => {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    if (!currentUserId) return;

    // Join the current user to their room
    socket.emit("join_room", currentUserId);

    // Listen for incoming messages
    socket.on("receive_message", (data) => {
      setMessages((prev) => [...prev, data]);
    });

    // Listen for typing indicator
    socket.on("typing", ({ senderId }) => {
      if (senderId === recipientId) {
        setIsTyping(true);
      }
    });

    // Listen for stop typing
    socket.on("stop_typing", ({ senderId }) => {
      if (senderId === recipientId) {
        setIsTyping(false);
      }
    });

    return () => {
      socket.off("receive_message");
      socket.off("typing");
      socket.off("stop_typing");
    };
  }, [currentUserId, recipientId]);

  const sendMessage = () => {
    if (message.trim() === "") return;

    const messageData = {
      senderId: currentUserId,
      recipientId: recipientId,
      sender: "You", // You can get actual name from user context
      message: message,
      time: new Date().toLocaleTimeString(),
    };

    // Emit message to backend
    socket.emit("send_message", messageData);

    // Add to local messages
    setMessages((prev) => [...prev, messageData]);
    setMessage("");
    socket.emit("stop_typing", { senderId: currentUserId, recipientId });
  };

  const handleTyping = (e) => {
    setMessage(e.target.value);
    // Emit typing indicator
    if (e.target.value.length > 0) {
      socket.emit("typing", { senderId: currentUserId, recipientId });
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div style={{ border: "1px solid #ccc", padding: "20px", borderRadius: "8px" }}>
      <h3>Chat with {recipientId}</h3>
      <div style={{ height: "300px", overflowY: "auto", border: "1px solid #ddd", padding: "10px", marginBottom: "10px", backgroundColor: "#f9f9f9" }}>
        {messages.length === 0 ? (
          <p style={{ color: "#999" }}>No messages yet. Start the conversation!</p>
        ) : (
          messages.map((msg, index) => (
            <div key={index} style={{ marginBottom: "10px" }}>
              <p style={{ margin: "0 0 5px 0" }}>
                <strong>{msg.sender}:</strong> {msg.message}
              </p>
              <small style={{ color: "#999" }}>{msg.time}</small>
            </div>
          ))
        )}
        {isTyping && <p style={{ color: "#999", fontStyle: "italic" }}>User is typing...</p>}
      </div>

      <div style={{ display: "flex", gap: "10px" }}>
        <input
          type="text"
          placeholder="Type message..."
          value={message}
          onChange={handleTyping}
          onKeyPress={handleKeyPress}
          style={{ flex: 1, padding: "8px", borderRadius: "4px", border: "1px solid #ddd" }}
        />
        <button
          onClick={sendMessage}
          style={{
            padding: "8px 16px",
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer"
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatBox;