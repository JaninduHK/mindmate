import React, { useState } from "react";
import { FiEdit2, FiTrash2, FiCheck, FiEye } from "react-icons/fi";

const MessageBubble = ({ message, currentUser, onEdit, onDelete }) => {
  const [showMenu, setShowMenu] = useState(false);

  // Handle both old format (sender) and new format (senderId)
  const senderId = message.senderId?._id || message.senderId || message.sender;
  const isMyMessage = senderId === currentUser;

  // Format timestamp
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const displayTime = message.time || formatTime(message.createdAt);

  // Check if message is deleted
  if (message.deletedAt) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: isMyMessage ? "flex-end" : "flex-start",
          marginBottom: "10px"
        }}
      >
        <div
          style={{
            backgroundColor: "#f0f0f0",
            color: "#999",
            padding: "10px 15px",
            borderRadius: "20px",
            maxWidth: "60%",
            fontStyle: "italic"
          }}
        >
          <div style={{ fontSize: "14px" }}>This message was deleted</div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        justifyContent: isMyMessage ? "flex-end" : "flex-start",
        marginBottom: "10px",
        position: "relative"
      }}
      onMouseEnter={() => setShowMenu(true)}
      onMouseLeave={() => setShowMenu(false)}
    >
      <div
        style={{
          backgroundColor: isMyMessage ? "#4CAF50" : "#e5e5ea",
          color: isMyMessage ? "white" : "black",
          padding: "10px 15px",
          borderRadius: "20px",
          maxWidth: "60%"
        }}
      >
        <div style={{ fontSize: "14px" }}>
          {message.message}
        </div>

        <div style={{ fontSize: "12px", marginTop: "5px", display: "flex", alignItems: "center", gap: "5px", opacity: 0.7 }}>
          <span>{displayTime}</span>
          {isMyMessage && (
            <span style={{ display: "flex", alignItems: "center", gap: "2px" }}>
              {message.readAt ? (
                <>
                  <FiCheck size={12} style={{ marginTop: "-1px" }} />
                  <FiCheck size={12} style={{ marginTop: "-1px", marginLeft: "-6px" }} />
                </>
              ) : (
                <FiCheck size={12} />
              )}
            </span>
          )}
          {message.isEdited && <span>(edited)</span>}
        </div>
      </div>

      {isMyMessage && showMenu && (
        <div style={{ display: "flex", gap: "8px", marginLeft: "8px", alignItems: "center" }}>
          <button
            onClick={() => onEdit?.(message._id, message.message)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#666",
              fontSize: "18px",
              padding: "4px"
            }}
            title="Edit message"
          >
            <FiEdit2 />
          </button>
          <button
            onClick={() => onDelete?.(message._id)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#f44336",
              fontSize: "18px",
              padding: "4px"
            }}
            title="Delete message"
          >
            <FiTrash2 />
          </button>
        </div>
      )}
    </div>
  );
};

export default MessageBubble;