import React from "react";

const MessageBubble = ({ message, currentUser }) => {

  const isMyMessage = message.sender === currentUser;

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

        <div
          style={{
            fontSize: "10px",
            marginTop: "5px",
            textAlign: "right",
            opacity: 0.7
          }}
        >
          {message.time}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;