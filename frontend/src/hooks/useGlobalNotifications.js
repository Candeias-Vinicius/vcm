import { useEffect } from 'react';
import { io } from 'socket.io-client';
import { showNativeNotification } from '../utils/notifications';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || '';

let globalSocket = null;

function getGlobalSocket() {
  if (!globalSocket) {
    globalSocket = io(SOCKET_URL, { autoConnect: false, path: '/socket.io' });
  }
  return globalSocket;
}

export function useGlobalNotifications(userNick, onAlert, onDelayed) {
  useEffect(() => {
    const socket = getGlobalSocket();
    if (!socket.connected) socket.connect();

    const handleAlert = (data) => {
      if (data.player_nicks && userNick && !data.player_nicks.includes(userNick)) return;
      showNativeNotification('⏰ Partida em 10 minutos!', data.message);
      onAlert?.(data);
    };

    const handleDelayed = (data) => {
      if (data.player_nicks && userNick && !data.player_nicks.includes(userNick)) return;
      showNativeNotification('⚠️ Partida atrasada', data.message);
      onDelayed?.(data);
    };

    socket.on('lobby_alert', handleAlert);
    socket.on('lobby_delayed', handleDelayed);

    return () => {
      socket.off('lobby_alert', handleAlert);
      socket.off('lobby_delayed', handleDelayed);
    };
  }, [userNick]);
}