import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

export function useAnsibleSocket(enabled = true) {
  const [isAnsibleSocketConnected, setIsAnsibleSocketConnected] = useState(false);
  const [ansibleSocketId, setAnsibleSocketId] = useState(null);
  const ansibleSocketRef = useRef(null);

  useEffect(() => {
    if (!enabled) return;
    const userId = localStorage.getItem("userId")
    const labId = localStorage.getItem("labId")
    const toolId = localStorage.getItem("toolId")

    const socket = io(process.env.REACT_APP_ANSIBLE_SOCKET_URL, {
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

    socket.on('connect', () => {
      console.log('Ansible Socket connected');
      setIsAnsibleSocketConnected(true);
      setAnsibleSocketId(socket.id);
    });

    socket.on('disconnect', (reason) => {
      console.log('Ansible Socket disconnected:', reason);
      setIsAnsibleSocketConnected(false);
      setAnsibleSocketId(null);
    });

    socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      setIsAnsibleSocketConnected(false);
    });

    ansibleSocketRef.current = socket;

    return () => {
      socket.disconnect();
      ansibleSocketRef.current = null;
    };
  }, [enabled]);

  const emit = (event, data) => {
    if (ansibleSocketRef.current) {
      ansibleSocketRef.current.emit(event, data);
    } else {
      console.error('Ansible Socket is not connected');
    }
  };

  return { socket: ansibleSocketRef.current, isAnsibleSocketConnected, ansibleSocketId, emit };
}
