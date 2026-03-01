const service = require('../services/lobby.service');

module.exports = function registerSocketHandlers(io) {
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

    socket.on('disconnect', () => {});
  });
};
