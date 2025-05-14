import { useSocket } from "./SocketContext"

export const useLogout = () => {
  const { disconnect } = useSocket()

  const logout = () => {
    // Disconnect socket
    disconnect()

    // Your existing logout logic
    // e.g., clear auth tokens, redirect to login page, etc.
  }

  return { logout }
}
