import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

export function useJenkinsSocket(enabled = true) {
  const [isJenkinsSocketConnected, setIsJenkinsSocketConnected] = useState(false);
  const [jenkinsSocketId, setJenkinsSocketId] = useState(null);
  const jenkinsSocketRef = useRef(null);

  useEffect(() => {
    if (!enabled) return;
    const userId = localStorage.getItem("userId")
    const labId = localStorage.getItem("labId")
    const toolId = localStorage.getItem("toolId")
    const socket = io(process.env.REACT_APP_JENKINS_SOCKET_URL, {
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
      console.log("Jenkins Socket connected");
      setIsJenkinsSocketConnected(true);
      setJenkinsSocketId(socket.id);
    });

    socket.on("disconnect", (reason) => {
      console.log("Jenkins Socket disconnected:", reason);
      setIsJenkinsSocketConnected(false);
      setJenkinsSocketId(null);
    });

    socket.on("connect_error", (error) => {
      console.error("Jenkins connection error:", error);
      setIsJenkinsSocketConnected(false);
    });

    jenkinsSocketRef.current = socket;

    return () => {
      socket.disconnect();
      jenkinsSocketRef.current = null;
    };
  }, [enabled]);

  const emit = (event, data) => {
    if (jenkinsSocketRef.current) {
      jenkinsSocketRef.current.emit(event, data);
    } else {
      console.error("Jenkins Socket is not connected");
    }
  };

  return {
    socket: jenkinsSocketRef.current,
    isJenkinsSocketConnected,
    jenkinsSocketId,
    emit,
  };
}
