import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

export function useKubernetesSocket(enabled = true) {
  const [isKubernetesSocketConnected, setIsKubernetesSocketConnected] = useState(false);
  const [kubernetesSocketId, setKubernetesSocketId] = useState(null);
  const kubernetesSocketRef = useRef(null);

  useEffect(() => {
    if (!enabled) return;
    const userId = localStorage.getItem("userId")
    const labId = localStorage.getItem("labId")
    const toolId = localStorage.getItem("toolId")

    const socket = io(process.env.REACT_APP_KUBERNETES_SOCKET_URL, {
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
      console.log("Kubernetes Socket connected");
      setIsKubernetesSocketConnected(true);
      setKubernetesSocketId(socket.id);
    });

    socket.on("disconnect", (reason) => {
      console.log("Kubernetes Socket disconnected:", reason);
      setIsKubernetesSocketConnected(false);
      setKubernetesSocketId(null);
    });

    socket.on("connect_error", (error) => {
      console.error("Kubernetes connection error:", error);
      setIsKubernetesSocketConnected(false);
    });

    kubernetesSocketRef.current = socket;

    return () => {
      socket.disconnect();
      kubernetesSocketRef.current = null;
    };
  }, [enabled]);

  const emit = (event, data) => {
    if (kubernetesSocketRef.current) {
      kubernetesSocketRef.current.emit(event, data);
    } else {
      console.error("Kubernetes Socket is not connected");
    }
  };

  return {
    socket: kubernetesSocketRef.current,
    isKubernetesSocketConnected,
    kubernetesSocketId,
    emit,
  };
}
