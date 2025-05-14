import { createContext, useContext, useEffect, useRef, useState } from "react"
import { io } from "socket.io-client"
import { useAuthContext } from "../API/UseAuthContext"

// Create context
const SocketContext = createContext(null)

// Custom hook to use the socket context
export const useSocket = () => {
  const context = useContext(SocketContext)
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider")
  }
  return context
}

export const SocketProvider = ({ children }) => {
  const { user } = useAuthContext()
  const socketRef = useRef(null)
  const [isConnected, setIsConnected] = useState(false)
  const [onlineUsers, setOnlineUsers] = useState([])
  const [messages, setMessages] = useState({})

  // Initialize socket connection when user is authenticated
  useEffect(() => {
    if (!user) return

    // Create socket connection if it doesn't exist
    if (!socketRef.current) {
      socketRef.current = io(process.env.REACT_APP_CHATTING_SOCKET_URL, {
        withCredentials: true,
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      })

      // Set up event listeners
      socketRef.current.on("connect", () => {
        setIsConnected(true)
        // Register user when socket connects
        socketRef.current.emit("register", user.username)
      })

      socketRef.current.on("disconnect", () => {
        console.log("Socket disconnected")
        setIsConnected(false)
      })

      socketRef.current.on("onlineUsers", (users) => {
        // Filter out current user from the list
        const filteredUsers = users.filter((onlineUser) => onlineUser.username !== user.username)
        setOnlineUsers(filteredUsers)
      })

      socketRef.current.on("receiveMessage", ({ message, from }) => {
        setMessages((prevMessages) => {
          const newMessages = { ...prevMessages }
          if (!newMessages[from]) {
            newMessages[from] = []
          }
          newMessages[from].push({
            text: message,
            sender: from,
            timestamp: new Date().toISOString(),
          })
          return newMessages
        })
      })
    } else if (isConnected) {
      // If socket exists and is connected, make sure user is registered
      socketRef.current.emit("register", user.username)
    }

    // Clean up function
    return () => {
      // We don't disconnect on component unmount
      // The socket will be disconnected when the user logs out or the page is closed
    }
  }, [user, isConnected])

  // Function to send a message
  const sendMessage = ({ toSocketId, message }) => {
    if (!socketRef.current || !isConnected || !user) return false

    socketRef.current.emit("sendMessage", {
      toSocketId,
      message,
      from: user.username,
    })

    // Optimistically add to UI
    setMessages((prevMessages) => {
      // Find the username associated with this socketId
      const recipient = onlineUsers.find((u) => u.socketId === toSocketId)
      if (!recipient) return prevMessages

      const newMessages = { ...prevMessages }
      if (!newMessages[recipient.username]) {
        newMessages[recipient.username] = []
      }
      newMessages[recipient.username].push({
        text: message,
        sender: user.username,
        timestamp: new Date().toISOString(),
      })
      return newMessages
    })

    return true
  }

  // Function to manually disconnect (for logout)
  const disconnect = () => {
    if (socketRef.current) {
      socketRef.current.disconnect()
      socketRef.current = null
      setIsConnected(false)
    }
  }

  // Value to be provided by the context
  const value = {
    socket: socketRef.current,
    isConnected,
    onlineUsers,
    messages,
    sendMessage,
    disconnect,
  }

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
}
