import { useEffect } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || '';

let globalSocket = null;

function getGlobalSocket() {
  if (!globalSocket) {
    globalSocket = io(SOCKET_URL, { autoConnect: false, path: '/socket.io' });
  }
  return globalSocket;
}

export function useGlobalNotifications(onAlert, onDelayed) {
  useEffect(() => {
    const socket = getGlobalSocket();
    if (!socket.connected) socket.connect();

    const handleAlert = (data) => onAlert?.(data);
    const handleDelayed = (data) => onDelayed?.(data);

    socket.on('lobby_alert', handleAlert);
    socket.on('lobby_delayed', handleDelayed);

    return () => {
      socket.off('lobby_alert', handleAlert);
      socket.off('lobby_delayed', handleDelayed);
    };
  }, []);
}
