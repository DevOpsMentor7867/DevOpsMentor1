import { createContext, useContext } from "react"
import { useChatSocket } from "../Dashboard/hooks/useChatSocket"

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
  // Use our new hook to manage socket state
  const socketData = useChatSocket()

  return <SocketContext.Provider value={socketData}>{children}</SocketContext.Provider>
}
