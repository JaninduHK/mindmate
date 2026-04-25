import { useEffect, useState, useRef } from "react";
import { socket } from "../../socket/socket";
import { chatAPI } from "../../api/chat.api";
import MessageBubble from "./MessageBubble";
import { FiSearch, FiX } from "react-icons/fi";
import toast from "react-hot-toast";
import { useNotification } from "../../hooks/useNotification";
import { showMessageNotification } from "../notifications/MessageNotification";

const ChatBox = ({ currentUserId, recipientId, recipientName }) => {
  const { clearMessageNotifications } = useNotification();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editingMessageText, setEditingMessageText] = useState("");
  const [deletingMessageId, setDeletingMessageId] = useState(null);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load message history when chat opens or recipient changes
  useEffect(() => {
    if (!currentUserId || !recipientId) return;

    const loadMessageHistory = async () => {
      try {
        setLoading(true);
        const response = await chatAPI.getMessageHistory(currentUserId, recipientId);
        if (response.success && response.data.messages) {
          setMessages(response.data.messages);
          // Mark messages as read
          await chatAPI.markConversationAsRead(currentUserId, recipientId);
          // Clear notification badge when opening chat
          clearMessageNotifications();
        }
      } catch (error) {
        console.error('Error loading message history:', error);
        toast.error('Failed to load message history');
      } finally {
        setLoading(false);
      }
    };

    loadMessageHistory();
  }, [currentUserId, recipientId, clearMessageNotifications]);

  // Socket listeners for real-time messages
  useEffect(() => {
    if (!currentUserId) return;

    console.log("[Chat] Joining room with userId:", currentUserId);
    socket.emit("join_room", currentUserId);

    socket.on("connect", () => {
      console.log("[Chat] Socket connected:", socket.id);
      setIsConnected(true);
      socket.emit("join_room", currentUserId);
    });

    socket.on("receive_message", (data) => {
      console.log("[Chat] Received message:", data);
      setMessages((prev) => [...prev, data]);
      
      // Mark as read
      socket.emit("mark_read", {
        messageId: data._id,
        userId: currentUserId,
        senderId: data.senderId,
      });
    });

    socket.on("message_edited", (data) => {
      console.log("[Chat] Message edited:", data);
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === data.messageId
            ? { ...msg, message: data.newMessage, editedAt: data.editedAt, isEdited: true }
            : msg
        )
      );
    });

    socket.on("message_deleted", (data) => {
      console.log("[Chat] Real-time delete received for:", data.messageId);
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === data.messageId
            ? { ...msg, deletedAt: new Date(), deletedBy: data.deletedBy }
            : msg
        )
      );
      setDeletingMessageId(null);
    });

    socket.on("message_read", (data) => {
      console.log("[Chat] Message read:", data);
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === data.messageId
            ? { ...msg, readAt: data.readAt }
            : msg
        )
      );
    });

    socket.on("typing", ({ senderId }) => {
      if (senderId === recipientId) {
        setIsTyping(true);
      }
    });

    socket.on("stop_typing", ({ senderId }) => {
      if (senderId === recipientId) {
        setIsTyping(false);
      }
    });

    socket.on("connect_error", (error) => {
      console.error("[Chat] Socket connection error:", error);
      toast.error("Failed to connect to chat server: " + error.message);
    });

    socket.on("disconnect", (reason) => {
      console.log("[Chat] Socket disconnected:", reason);
      setIsConnected(false);
    });

    socket.on("message_error", (data) => {
      console.error("[Chat] Message error:", data);
      toast.error("Message error: " + data.error);
    });

    return () => {
      socket.off("connect");
      socket.off("receive_message");
      socket.off("message_edited");
      socket.off("message_deleted");
      socket.off("message_read");
      socket.off("typing");
      socket.off("stop_typing");
      socket.off("connect_error");
      socket.off("disconnect");
      socket.off("message_error");
    };
  }, [currentUserId, recipientId]);

  const sendMessage = () => {
    if (message.trim() === "") {
      toast.error("Message cannot be empty");
      return;
    }

    if (!currentUserId || !recipientId) {
      toast.error("User IDs missing. Please refresh the page.");
      console.error("[Chat] Missing IDs - currentUserId:", currentUserId, "recipientId:", recipientId);
      return;
    }

    const messageData = {
      senderId: currentUserId,
      recipientId: recipientId,
      sender: currentUserId,
      message: message,
      time: new Date().toLocaleTimeString(),
    };

    console.log("[Chat] Sending message:", messageData);
    
    if (!socket.connected) {
      console.error("[Chat] Socket not connected, attempting to reconnect...");
      socket.connect();
      toast.error("Reconnecting to chat server, please try again in a moment.");
      return;
    }

    socket.emit("send_message", messageData);
    console.log("[Chat] Message emitted to socket");
    setMessage("");
    socket.emit("stop_typing", { senderId: currentUserId, recipientId });
  };

  const handleEdit = (messageId, messageText) => {
    setEditingMessageId(messageId);
    setEditingMessageText(messageText);
  };

  const saveEdit = async () => {
    if (!editingMessageText.trim()) return;

    try {
      await chatAPI.editMessage(editingMessageId, editingMessageText, currentUserId);
      socket.emit("edit_message", {
        messageId: editingMessageId,
        newMessage: editingMessageText,
        senderId: currentUserId,
        recipientId,
      });
      toast.success("Message updated");
      setEditingMessageId(null);
      setEditingMessageText("");
    } catch (error) {
      console.error('Error editing message:', error);
      toast.error("Failed to edit message");
    }
  };

  const handleDelete = async (messageId) => {
    if (!window.confirm("Delete this message?")) return;

    setDeletingMessageId(messageId);

    try {
      // Optimistic update - delete locally first
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === messageId
            ? { ...msg, deletedAt: new Date(), deletedBy: currentUserId }
            : msg
        )
      );

      // Then sync to backend
      await chatAPI.deleteMessage(messageId, currentUserId);

      // Emit real-time event to other user
      socket.emit("delete_message", {
        messageId,
        userId: currentUserId,
        recipientId,
      });

      toast.success("Message deleted");
    } catch (error) {
      console.error('Error deleting message:', error);
      toast.error("Failed to delete message");
      
      // Revert on error
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === messageId
            ? { ...msg, deletedAt: null, deletedBy: null }
            : msg
        )
      );
    } finally {
      setDeletingMessageId(null);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const response = await chatAPI.searchMessages(currentUserId, recipientId, searchQuery);
      if (response.success) {
        setSearchResults(response.data.messages);
      }
    } catch (error) {
      console.error('Error searching messages:', error);
      toast.error("Search failed");
    }
  };

  const handleTyping = (e) => {
    setMessage(e.target.value);

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

  const displayMessages = searchQuery ? searchResults : messages;

  return (
    <div style={{ border: "1px solid #ccc", padding: "20px", borderRadius: "8px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
        <h3>Chat with {recipientName || recipientId}</h3>
        <button
          onClick={() => setShowSearch(!showSearch)}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: "18px",
          }}
        >
          <FiSearch />
        </button>
      </div>

      {showSearch && (
        <div style={{ display: "flex", gap: "10px", marginBottom: "15px" }}>
          <input
            type="text"
            placeholder="Search messages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSearch()}
            style={{
              flex: 1,
              padding: "8px",
              borderRadius: "4px",
              border: "1px solid #ddd"
            }}
          />
          <button
            onClick={handleSearch}
            style={{
              padding: "8px 16px",
              backgroundColor: "#007bff",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer"
            }}
          >
            Search
          </button>
          <button
            onClick={() => {
              setShowSearch(false);
              setSearchQuery("");
              setSearchResults([]);
            }}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: "18px",
            }}
          >
            <FiX />
          </button>
        </div>
      )}

      <div
        style={{
          height: "400px",
          overflowY: "auto",
          border: "1px solid #ddd",
          padding: "10px",
          marginBottom: "10px",
          backgroundColor: "#f9f9f9"
        }}
      >
        {loading && <p style={{ color: "#999" }}>Loading message history...</p>}

        {displayMessages.length === 0 && !loading && (
          <p style={{ color: "#999" }}>
            {searchQuery ? "No messages found" : "No messages yet. Start the conversation!"}
          </p>
        )}

        {displayMessages.map((msg, index) => (
          <MessageBubble
            key={msg._id || index}
            message={msg}
            currentUser={currentUserId}
            onEdit={handleEdit}
            onDelete={handleDelete}
            isDeleting={deletingMessageId === msg._id}
          />
        ))}

        {isTyping && (
          <p style={{ color: "#999", fontStyle: "italic" }}>
            User is typing...
          </p>
        )}

        <div ref={messagesEndRef} />
      </div>

      {editingMessageId && (
        <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
          <input
            type="text"
            value={editingMessageText}
            onChange={(e) => setEditingMessageText(e.target.value)}
            style={{
              flex: 1,
              padding: "8px",
              borderRadius: "4px",
              border: "1px solid #ddd"
            }}
            placeholder="Edit message..."
          />
          <button
            onClick={saveEdit}
            style={{
              padding: "8px 16px",
              backgroundColor: "#4CAF50",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer"
            }}
          >
            Save
          </button>
          <button
            onClick={() => {
              setEditingMessageId(null);
              setEditingMessageText("");
            }}
            style={{
              padding: "8px 16px",
              backgroundColor: "#f44336",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer"
            }}
          >
            Cancel
          </button>
        </div>
      )}

      {!isConnected && (
        <div style={{
          padding: "8px 12px",
          marginBottom: "10px",
          backgroundColor: "#fff3cd",
          border: "1px solid #ffc107",
          borderRadius: "4px",
          color: "#856404",
          fontSize: "13px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <span>Disconnected from chat server. Reconnecting...</span>
          <button
            onClick={() => socket.connect()}
            style={{
              background: "none",
              border: "1px solid #856404",
              borderRadius: "4px",
              padding: "2px 8px",
              cursor: "pointer",
              color: "#856404",
              fontSize: "12px"
            }}
          >
            Retry
          </button>
        </div>
      )}

      <div style={{ display: "flex", gap: "10px" }}>
        <input
          type="text"
          placeholder="Type message..."
          value={message}
          onChange={handleTyping}
          onKeyPress={handleKeyPress}
          disabled={!isConnected}
          style={{
            flex: 1,
            padding: "8px",
            borderRadius: "4px",
            border: "1px solid #ddd",
            opacity: isConnected ? 1 : 0.6
          }}
        />

        <button
          onClick={sendMessage}
          disabled={!isConnected}
          style={{
            padding: "8px 16px",
            backgroundColor: isConnected ? "#007bff" : "#aaa",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: isConnected ? "pointer" : "not-allowed"
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatBox;