import { useState, useEffect, useRef } from "react";
import { useAuthContext } from "../../../API/UseAuthContext";
import { useSocket } from "../../../Context/SocketContext";
import { useToast } from "./Toast"; // Import the toast hook

const Chat = ({ onClose }) => {
  const [messageInput, setMessageInput] = useState("");
  const [activeChat, setActiveChat] = useState(null);
  const { user } = useAuthContext();
  const {
    onlineUsers,
    messages,
    sendMessage,
    isConnected,
    newMessage,
    clearNewMessage,
  } = useSocket();
  const messagesEndRef = useRef(null);
  const { showToast, toastPortal } = useToast();

  // Show toast notification when a new message is received
  useEffect(() => {
    if (newMessage) {
      // Only show toast if the chat with this user is not currently active
      if (!activeChat || activeChat.username !== newMessage.sender) {
        showToast(newMessage.text, newMessage.sender);
      }
      clearNewMessage();
    }
  }, [newMessage, activeChat, showToast, clearNewMessage]);

  // Add additional debug logging to help troubleshoot issues

  // Add this at the top of the component, after the hooks
  useEffect(() => {
    // Debug logging for socket connection
    console.log(
      "Socket connection status:",
      isConnected ? "Connected" : "Disconnected"
    );
    console.log("Current user:", user);
    console.log("Online users count:", onlineUsers.length);

    if (onlineUsers.length === 0) {
      console.log(
        "No online users detected. Check if 'register' event was sent properly."
      );
    }
  }, [isConnected, user, onlineUsers.length]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, activeChat]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Update the message sending function to include more logging
  const handleSendMessage = (e) => {
    e.preventDefault();

    if (!messageInput.trim() || !activeChat) {
      console.log("Cannot send message: empty message or no active chat");
      return;
    }

    console.log(
      "Attempting to send message to:",
      activeChat.username,
      "socketId:",
      activeChat.socketId
    );

    // Send message using the context function
    const success = sendMessage({
      toSocketId: activeChat.socketId,
      message: messageInput,
    });

    if (success) {
      console.log("Message sent successfully");
      setMessageInput("");
    } else {
      console.error("Failed to send message");
    }
  };

  const selectChat = (user) => {
    setActiveChat(user);
  };

  // Format timestamp to readable time
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // Determine if a message is from the current user
  const isOwnMessage = (message) => {
    return message.sender === user.username;
  };

  // Get color theme based on index
  const getThemeColor = (index) => {
    if (index % 3 === 0)
      return {
        primary: "text-[#09D1C7]",
        bg: "bg-[#09D1C7]",
        bgLight: "bg-[#09D1C7]/10",
        bgHover: "hover:bg-[#09D1C7]/20",
        border: "border-[#09D1C7]/20",
      };
    else if (index % 3 === 1)
      return {
        primary: "text-[#80EE98]",
        bg: "bg-[#80EE98]",
        bgLight: "bg-[#80EE98]/10",
        bgHover: "hover:bg-[#80EE98]/20",
        border: "border-[#80EE98]/20",
      };
    return {
      primary: "text-white",
      bg: "bg-white",
      bgLight: "bg-white/10",
      bgHover: "hover:bg-white/20",
      border: "border-white/10",
    };
  };

  // Debug logging for troubleshooting
  useEffect(() => {
    console.log("Current online users:", onlineUsers);
    console.log("Current messages:", messages);
    console.log("Active chat:", activeChat);
  }, [onlineUsers, messages, activeChat]);

  return (
    <div className="z-50 backdrop-blur-sm fixed inset-0 bg-black/50 flex items-center justify-center">
      <div className="bg-[#1A202C] rounded-lg p-6 w-[1000px] h-[600px] flex overflow-hidden">
        {/* Sidebar with online users */}
        <div className="w-1/3 border-r border-white/10 pr-4 overflow-y-auto custom-scrollbar">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">Chats</h2>
            <button
              onClick={onClose}
              className="text-white/60 hover:text-white"
            >
              ✕
            </button>
          </div>

          <div className="space-y-2">
            {onlineUsers.length > 0 ? (
              onlineUsers.map((user, index) => (
                <div
                  key={user.socketId}
                  onClick={() => selectChat(user)}
                  className={`
                    p-3 rounded-lg cursor-pointer transition-colors flex items-center
                    ${
                      activeChat?.socketId === user.socketId
                        ? getThemeColor(index).bgLight
                        : "hover:bg-white/5"
                    }
                    ${getThemeColor(index).border}
                  `}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      getThemeColor(index).bg
                    }`}
                  >
                    <span
                      className={`text-md ${
                        index % 3 === 0 || index % 3 === 1
                          ? "text-black"
                          : "text-black"
                      }`}
                    >
                      {user.username[0].toUpperCase()}
                    </span>
                  </div>
                  <div className="ml-3">
                    <h3
                      className={`font-medium ${getThemeColor(index).primary}`}
                    >
                      {user.username}
                    </h3>
                    <p className="text-white/60 text-xs">Online</p>
                  </div>
                  <div className="ml-auto">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-white/60">
                No users online at the moment
              </div>
            )}
          </div>
        </div>

        {/* Chat area */}
        <div className="w-2/3 flex flex-col pl-4">
          {activeChat ? (
            <>
              {/* Chat header */}
              <div className="py-4 border-b border-white/10 flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    getThemeColor(
                      onlineUsers.findIndex(
                        (u) => u.socketId === activeChat.socketId
                      )
                    ).bg
                  }`}
                >
                  <span className="text-black">
                    {activeChat.username[0].toUpperCase()}
                  </span>
                </div>
                <div className="ml-3">
                  <h3
                    className={`font-medium ${
                      getThemeColor(
                        onlineUsers.findIndex(
                          (u) => u.socketId === activeChat.socketId
                        )
                      ).primary
                    }`}
                  >
                    {activeChat.username}
                  </h3>
                  <p className="text-white/60 text-xs">Online</p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto py-4 custom-scrollbar">
                <div className="space-y-4">
                  {messages[activeChat.username]?.map((message, index) => {
                    const own = isOwnMessage(message);
                    const themeIndex = own
                      ? 0
                      : onlineUsers.findIndex(
                          (u) => u.username === message.sender
                        );
                    const theme = getThemeColor(themeIndex);

                    return (
                      <div
                        key={index}
                        className={`flex ${
                          own ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div
                          className={`
                            max-w-[70%] rounded-lg p-3 
                            ${own ? theme.bgLight : "bg-white/10"}
                          `}
                        >
                          <p
                            className={`${own ? theme.primary : "text-white"}`}
                          >
                            {message.text}
                          </p>
                          <p className="text-white/40 text-xs text-right mt-1">
                            {formatTime(message.timestamp)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {!messages[activeChat.username]?.length && (
                  <div className="text-center py-8 text-white/60">
                    No messages yet. Start the conversation!
                  </div>
                )}
              </div>

              {/* Message input */}
              <form
                onSubmit={handleSendMessage}
                className="border-t border-white/10 pt-4"
              >
                <div className="flex items-center">
                  <input
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 bg-white/5 rounded-l-lg py-3 px-4 outline-none text-white"
                  />
                  <button
                    type="submit"
                    className={`
                      py-3 px-6 rounded-r-lg font-medium
                      ${getThemeColor(0).bgLight} ${getThemeColor(0).primary} ${
                      getThemeColor(0).bgHover
                    }
                    `}
                  >
                    Send
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <p className="text-white/60 text-lg mb-4">
                  Select a chat to start messaging
                </p>
                <div
                  className={`w-16 h-16 rounded-full ${
                    getThemeColor(0).bgLight
                  } flex items-center justify-center mx-auto`}
                >
                  <span className={`text-3xl ${getThemeColor(0).primary}`}>
                    💬
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      {toastPortal}
    </div>
  );
};

export default Chat;
