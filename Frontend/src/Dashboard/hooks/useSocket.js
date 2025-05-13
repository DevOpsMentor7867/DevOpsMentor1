import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

export function useSocket(dockerImage) {
  const [isConnected, setIsConnected] = useState(false);
  const [socketId, setSocketId] = useState(null);
  const socketRef = useRef(null);

  useEffect(() => {
    const userId = localStorage.getItem("userId")
    const labId = localStorage.getItem("labId")
    const toolId = localStorage.getItem("toolId")
    
    // Return early if dockerImage is null or undefined
    if (!dockerImage) {
      return;
    }

    const socket = io(process.env.REACT_APP_SOCKET_URL, {
      withCredentials: true,
      transports: ["websocket", "polling"],
      auth: {
        userId,
        toolId,
        labId,
        docker_image: dockerImage || "ubuntu:latest",
      },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.on("connect", () => {
      console.log("Socket connected");
      setIsConnected(true);
      setSocketId(socket.id);
    });

    socket.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
      setIsConnected(false);
      setSocketId(null);
    });

    socket.on("connect_error", (error) => {
      console.error("Connection error:", error);
      setIsConnected(false);
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [dockerImage]);

  const emit = (event, data) => {
    if (socketRef.current) {
      socketRef.current.emit(event, data);
    } else {
      console.error("Socket is not connected");
    }
  };

  return { socket: socketRef.current, isConnected, socketId, emit };
}
