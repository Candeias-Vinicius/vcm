import { useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';

// Em dev: Vite faz proxy /socket.io → localhost:3001
// Em produção (Docker): nginx faz proxy /socket.io → backend:3001
// '' = usa a origem atual do navegador (window.location.origin)
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || '';

let socketInstance = null;

function getSocket() {
  if (!socketInstance) {
    socketInstance = io(SOCKET_URL, { autoConnect: false, path: '/socket.io', withCredentials: true });
  }
  return socketInstance;
}

export function useSocket(lobbyId, onLobbyUpdated, onChatMessage) {
  const callbackRef = useRef(onLobbyUpdated);
  callbackRef.current = onLobbyUpdated;
  const chatCallbackRef = useRef(onChatMessage);
  chatCallbackRef.current = onChatMessage;

  useEffect(() => {
    if (!lobbyId) return;

    const socket = getSocket();
    if (!socket.connected) socket.connect();

    socket.emit('join_lobby', lobbyId);

    const handleUpdate = (data) => callbackRef.current?.(data);
    const handleChat = (msg) => chatCallbackRef.current?.(msg);

    socket.on('lobby_updated', handleUpdate);
    socket.on('chat_message', handleChat);

    return () => {
      socket.off('lobby_updated', handleUpdate);
      socket.off('chat_message', handleChat);
      socket.emit('leave_lobby', lobbyId);
    };
  }, [lobbyId]);

  const sendMessage = useCallback((text) => {
    const socket = getSocket();
    if (socket.connected && lobbyId) {
      socket.emit('chat_message', { lobby_id: lobbyId, text });
    }
  }, [lobbyId]);

  return { sendMessage };
}
