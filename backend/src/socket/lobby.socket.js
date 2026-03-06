const service = require('../services/lobby.service');
const { verifyToken } = require('../config/jwt');

function parseCookieToken(cookieHeader) {
  if (!cookieHeader) return null;
  const match = cookieHeader.split(';').map(c => c.trim()).find(c => c.startsWith('vcm_token='));
  return match ? match.slice('vcm_token='.length) : null;
}

module.exports = function registerSocketHandlers(io) {
  // Authenticate socket connections via cookie JWT
  io.use((socket, next) => {
    const token = parseCookieToken(socket.handshake.headers.cookie);
    if (token) {
      try {
        socket.data.user = verifyToken(token);
      } catch {
        // unauthenticated — still allow connection, just no chat
        socket.data.user = null;
      }
    } else {
      socket.data.user = null;
    }
    next();
  });

  io.on('connection', (socket) => {
    // Entrar na sala do lobby para receber updates em tempo real
    socket.on('join_lobby', async (lobby_id) => {
      socket.join(lobby_id);
      try {
        const lobby = await service.getLobbyById(lobby_id);
        if (lobby) {
          socket.emit('lobby_updated', lobby);
        } else {
          socket.emit('lobby_error', { message: 'Lobby não encontrado' });
        }
      } catch (err) {
        socket.emit('lobby_error', { message: err.message });
      }
    });

    socket.on('leave_lobby', (lobby_id) => {
      socket.leave(lobby_id);
    });

    // Chat: broadcast message to all users in the lobby room
    let lastMessageAt = 0;
    socket.on('chat_message', ({ lobby_id, text }) => {
      if (!socket.data.user) return; // must be authenticated
      if (!lobby_id || typeof text !== 'string') return;

      const trimmed = text.trim().slice(0, 300);
      if (!trimmed) return;

      // Throttle: max 1 message per second per socket
      const now = Date.now();
      if (now - lastMessageAt < 1000) return;
      lastMessageAt = now;

      io.to(lobby_id).emit('chat_message', {
        nick: socket.data.user.nick,
        text: trimmed,
        ts: now,
      });
    });

    socket.on('disconnect', () => {});
  });
};
