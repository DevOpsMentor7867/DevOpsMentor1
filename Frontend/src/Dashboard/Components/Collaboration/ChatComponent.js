"use client";

import { useState, useEffect } from "react"
import Chat from "./Collaboration"; // Import the Chat component
import { useSocket } from "../../../Context/SocketContext"; // Adjust path as needed
import { useToast } from "./Toast"; // Import the toast hook

const ChatComponent = () => {
  const [showChat, setShowChat] = useState(false);
  const { onlineUsers, isConnected, reconnect, connectionAttempts, newMessage, clearNewMessage  } =
    useSocket();
  const { showToast, toastPortal } = useToast();

  // Show toast notification when a new message is received
  useEffect(() => {
    if (newMessage && !showChat) {
      showToast(newMessage.text, newMessage.sender);
      clearNewMessage();
    }
  }, [newMessage, showChat, showToast, clearNewMessage]);

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8 p-4 md:p-6 border-gray-400 bg-white/10">
          <h1 className="text-2xl font-bold text-white">Collaboration</h1>
          <div className="flex items-center gap-2">
            {!isConnected && (
              <button
                onClick={reconnect}
                className="bg-red-500/10 text-red-500 hover:bg-red-500/20 px-4 py-2 rounded-lg flex items-center"
              >
                <span className="mr-2">🔄</span>
                Reconnect{" "}
                {connectionAttempts > 0 ? `(${connectionAttempts})` : ""}
              </button>
            )}
            <button
              onClick={() => setShowChat(true)}
              className="bg-[#09D1C7]/10 text-[#09D1C7] hover:bg-[#09D1C7]/20 px-4 py-2 rounded-lg flex items-center"
            >
              <span className="mr-2">💬</span>
              Open Chat
              {onlineUsers.length > 0 && (
                <span className="ml-2 bg-[#09D1C7] text-black rounded-full w-5 h-5 flex items-center justify-center text-xs">
                  {onlineUsers.length}
                </span>
              )}
            </button>
          </div>
        </div>

        <div className="bg-[#1A202C] rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-white">Online Users</h2>
            <div className="flex items-center">
              <div
                className={`w-2 h-2 rounded-full ${
                  isConnected ? "bg-green-500" : "bg-red-500"
                } mr-2`}
              ></div>
              <span className="text-sm text-white/60">
                {isConnected ? "Connected" : "Disconnected"}
              </span>
            </div>
          </div>

          {onlineUsers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {onlineUsers.map((user, index) => {
                const colorClass =
                  index % 3 === 0
                    ? "border-[#09D1C7]/20 text-[#09D1C7]"
                    : index % 3 === 1
                    ? "border-[#80EE98]/20 text-[#80EE98]"
                    : "border-white/10 text-white";

                return (
                  <div
                    key={user.socketId}
                    className={`p-4 rounded-lg border ${colorClass} bg-[#1A202C]/50 hover:bg-white/5`}
                  >
                    <div className="flex items-center">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          index % 3 === 0
                            ? "bg-[#09D1C7]"
                            : index % 3 === 1
                            ? "bg-[#80EE98]"
                            : "bg-white"
                        }`}
                      >
                        <span className="text-black font-medium">
                          {user.username[0].toUpperCase()}
                        </span>
                      </div>
                      <div className="ml-3">
                        <h3 className="font-medium">{user.username}</h3>
                        <div className="flex items-center text-xs">
                          <div className="w-2 h-2 rounded-full bg-green-500 mr-1"></div>
                          <span className="text-white/60">Online</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-white/60">
              {isConnected
                ? "No users are currently online."
                : "Not connected to chat server. Click 'Reconnect' to try again."}
            </p>
          )}
        </div>
      </div>
      <div className="fixed inset-0 z-[-10]">
        <img
          src="/homebgc.jpg"
          alt="Background"
          className="w-full h-full object-cover mt-12"
        />
        <div className="absolute inset-0 bg-black/70" />
      </div>

      {showChat && <Chat onClose={() => setShowChat(false)} />}
      {toastPortal}
    </div>
  );
};

export default ChatComponent;
