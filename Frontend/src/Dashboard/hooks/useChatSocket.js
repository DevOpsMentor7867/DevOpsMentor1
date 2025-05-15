"use client";

import { useEffect, useRef, useState, useCallback } from "react"
import { io } from "socket.io-client";
import { useAuthContext } from "../../API/UseAuthContext";

export function useChatSocket(enabled = true) {
  const { user } = useAuthContext();
  const [isConnected, setIsConnected] = useState(false);
  const [socketId, setSocketId] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [messages, setMessages] = useState({});
  const socketRef = useRef(null);
  const [newMessage, setNewMessage] = useState(null);
  const [connectionAttempts, setConnectionAttempts] = useState(0);

  useEffect(() => {
    // Only connect if enabled and user is authenticated
    if (!enabled || !user) return;

    // Create socket connection if it doesn't exist
    if (!socketRef.current) {
      console.log("Creating new chat socket, attempt:", connectionAttempts + 1);

      // Get the base URL without any path or trailing slashes
      const socketUrl = process.env.REACT_APP_CHATTING_SOCKET_URL || "";

      // Extract just the origin part of the URL to avoid namespace issues
      let baseUrl = socketUrl;
      try {
        // Try to parse the URL to get just the origin
        const url = new URL(socketUrl);
        baseUrl = url.origin;
      } catch (e) {
        console.warn("Could not parse socket URL, using as-is:", socketUrl);
      }

      console.log("Connecting to socket URL:", baseUrl);

      // Try different connection approaches based on previous attempts
      try {
        // Create socket with minimal options first
        socketRef.current = io(baseUrl + "/chat", {
          transports: ["websocket", "polling"],
          reconnection: false, // We'll handle reconnection manually
          autoConnect: true,
          forceNew: true, // Force a new connection
        });

        console.log("Socket.IO instance created");

        // Set up event listeners
        socketRef.current.on("connect", () => {
          console.log(
            "Chat Socket connected successfully, ID:",
            socketRef.current.id
          );
          setIsConnected(true);
          setSocketId(socketRef.current.id);
          // Register user when socket connects
          socketRef.current.emit("register", user.username);
          // Reset connection attempts on successful connection
          setConnectionAttempts(0);
        });

        socketRef.current.on("disconnect", (reason) => {
          console.log("Chat Socket disconnected:", reason);
          setIsConnected(false);
          setSocketId(null);
        });

        socketRef.current.on("connect_error", (error) => {
          console.error("Chat connection error:", error);
          setIsConnected(false);

          // Increment connection attempts
          setConnectionAttempts((prev) => prev + 1);

          // Clean up the failed socket
          if (socketRef.current) {
            socketRef.current.disconnect();
            socketRef.current = null;
          }
        });

        socketRef.current.on("error", (error) => {
          console.error("Socket general error:", error);
        });

        socketRef.current.on("onlineUsers", (users) => {
          console.log("Received online users:", users);
          // Filter out current user from the list if needed
          const filteredUsers = Array.isArray(users)
            ? users.filter((onlineUser) => {
                const onlineUsername = (onlineUser.username || "")
                  .trim()
                  .toLowerCase();
                const currentUsername = (user.username || "")
                  .trim()
                  .toLowerCase();

                console.log(
                  `[Normalized] online: "${onlineUsername}", user: "${currentUsername}"`
                );

                return (
                  onlineUsername !== currentUsername && !!onlineUser.username
                );
              })
            : [];

          setOnlineUsers(filteredUsers);
          console.log("Filtered online users:", filteredUsers);
        });

        socketRef.current.on("receiveMessage", ({ message, from }) => {
          console.log("Received message from:", from, "message:", message);

          // Set the new message for toast notification
          setNewMessage({ text: message, sender: from });

          setMessages((prevMessages) => {
            const newMessages = { ...prevMessages };
            if (!newMessages[from]) {
              newMessages[from] = [];
            }
            newMessages[from].push({
              text: message,
              sender: from,
              timestamp: new Date().toISOString(),
            });
            return newMessages;
          });
        });
      } catch (error) {
        console.error("Error creating socket:", error);
        socketRef.current = null;
        setConnectionAttempts((prev) => prev + 1);
      }
    } else if (isConnected) {
      // If socket exists and is connected, make sure user is registered
      socketRef.current.emit("register", user.username);
    }

    // Clean up function
    return () => {
      if (socketRef.current) {
        // We don't disconnect on component unmount as per original implementation
        // The socket will be disconnected when the user logs out or the page is closed
      }
    };
  }, [user, enabled, isConnected, connectionAttempts]);

  // Try alternative connection approach if multiple attempts fail
  useEffect(() => {
    if (
      connectionAttempts > 0 &&
      connectionAttempts <= 3 &&
      !socketRef.current &&
      enabled &&
      user
    ) {
      // Wait before trying again with different options
      const timer = setTimeout(() => {
        console.log(
          `Retrying connection with alternative approach #${connectionAttempts}`
        );

        const socketUrl = process.env.REACT_APP_CHATTING_SOCKET_URL || "";

        try {
          // Try different connection approaches based on attempt number
          if (connectionAttempts === 1) {
            // Try with path explicitly set to empty
            socketRef.current = io(socketUrl, {
              path: "/socket.io",
              transports: ["websocket", "polling"],
              reconnection: false,
              forceNew: true,
              auth: {
                username: user.username,
              },
            });
          } else if (connectionAttempts === 2) {
            // Try with only websocket transport
            socketRef.current = io(socketUrl, {
              transports: ["websocket"],
              reconnection: false,
              forceNew: true,
            });
          } else if (connectionAttempts === 3) {
            // Last attempt - try with polling only
            socketRef.current = io(socketUrl, {
              transports: ["polling"],
              reconnection: false,
              forceNew: true,
            });
          }

          // Set up the same event listeners as before
          if (socketRef.current) {
            console.log(
              `Alternative connection attempt #${connectionAttempts} created`
            );

            // Re-attach all event listeners
            socketRef.current.on("connect", () => {
              console.log(
                "Chat Socket connected with alternative approach, ID:",
                socketRef.current.id
              );
              setIsConnected(true);
              setSocketId(socketRef.current.id);
              socketRef.current.emit("register", user.username);
              setConnectionAttempts(0);
            });

            // Re-attach other event listeners (same as above)
            socketRef.current.on("disconnect", (reason) => {
              console.log("Chat Socket disconnected:", reason);
              setIsConnected(false);
              setSocketId(null);
            });

            socketRef.current.on("connect_error", (error) => {
              console.error(
                `Alternative attempt #${connectionAttempts} connection error:`,
                error
              );
              setIsConnected(false);

              // Clean up the failed socket
              if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
              }
            });

            // Re-attach remaining event listeners
            socketRef.current.on("onlineUsers", (users) => {
              console.log("Received online users:", users);
              const filteredUsers = Array.isArray(users)
                ? users.filter(
                    (onlineUser) => onlineUser.username !== user.username
                  )
                : [];
              setOnlineUsers(filteredUsers);
            });

            socketRef.current.on("receiveMessage", ({ message, from }) => {
              setMessages((prevMessages) => {
                const newMessages = { ...prevMessages };
                if (!newMessages[from]) {
                  newMessages[from] = [];
                }
                newMessages[from].push({
                  text: message,
                  sender: from,
                  timestamp: new Date().toISOString(),
                });
                return newMessages;
              });
            });
          }
        } catch (error) {
          console.error(
            `Error in alternative connection attempt #${connectionAttempts}:`,
            error
          );
          socketRef.current = null;
        }
      }, 2000 * connectionAttempts); // Increasing delay between attempts

      return () => clearTimeout(timer);
    }
  }, [connectionAttempts, enabled, user]);

  // Function to send a message
  const sendMessage = ({ toSocketId, message }) => {
    if (!socketRef.current || !isConnected || !user) {
      console.warn("Cannot send message - socket not connected");
      return false;
    }

    console.log("Sending message to:", toSocketId, "Message:", message);
    socketRef.current.emit("sendMessage", {
      toSocketId,
      message,
      from: user.username,
    });

    // Optimistically add to UI
    setMessages((prevMessages) => {
      // Find the username associated with this socketId
      const recipient = onlineUsers.find((u) => u.socketId === toSocketId);
      if (!recipient) {
        console.warn("Recipient not found in online users:", toSocketId);
        return prevMessages;
      }

      const newMessages = { ...prevMessages };
      if (!newMessages[recipient.username]) {
        newMessages[recipient.username] = [];
      }
      newMessages[recipient.username].push({
        text: message,
        sender: user.username,
        timestamp: new Date().toISOString(),
      });
      return newMessages;
    });

    return true;
  };

  // Function to manually disconnect (for logout)
  const disconnect = () => {
    if (socketRef.current) {
      console.log("Manually disconnecting socket");
      socketRef.current.disconnect();
      socketRef.current = null;
      setIsConnected(false);
      setSocketId(null);
    }
  };

  // Function to manually attempt reconnection
  const reconnect = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    setConnectionAttempts((prev) => prev + 1);
  };

    // Function to clear the new message notification after it's been shown
  const clearNewMessage = useCallback(() => {
    setNewMessage(null)
  }, [])

  return {
    socket: socketRef.current,
    isConnected,
    socketId,
    onlineUsers,
    messages,
    newMessage,
    clearNewMessage,
    sendMessage,
    disconnect,
    reconnect,
    connectionAttempts,
  };
}
