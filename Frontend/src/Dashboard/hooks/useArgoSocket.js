import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

export function useArgoSocket(enabled = true) {
  const [isArgoSocketConnected, setIsArgoSocketConnected] = useState(false);
  const [argoSocketId, setArgoSocketId] = useState(null);
  const argoSocketRef = useRef(null);

  useEffect(() => {
    if (!enabled) return;
    if (!enabled) return;
    const userId = localStorage.getItem("userId")
    const labId = localStorage.getItem("labId")
    const toolId = localStorage.getItem("toolId")

    const socket = io(process.env.REACT_APP_ARGO_SOCKET_URL, {
      withCredentials: true,
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      auth: {
        userId,
        toolId,
        labId,}
    });

    socket.on("connect", () => {
      console.log("Argo Socket connected");
      setIsArgoSocketConnected(true);
      setArgoSocketId(socket.id);
    });

    socket.on("disconnect", (reason) => {
      console.log("Argo Socket disconnected:", reason);
      setIsArgoSocketConnected(false);
      setArgoSocketId(null);
    });

    socket.on("connect_error", (error) => {
      console.error("Argo connection error:", error);
      setIsArgoSocketConnected(false);
    });

    argoSocketRef.current = socket;

    return () => {
      socket.disconnect();
      argoSocketRef.current = null;
    };
  }, [enabled]);

  const emit = (event, data) => {
    if (argoSocketRef.current) {
      argoSocketRef.current.emit(event, data);
    } else {
      console.error("Argo Socket is not connected");
    }
  };

  return {
    socket: argoSocketRef.current,
    isArgoSocketConnected,
    argoSocketId,
    emit,
  };
}
