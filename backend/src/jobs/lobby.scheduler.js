const cron = require('node-cron');
const Lobby = require('../models/Lobby');

function startScheduler(io) {
  cron.schedule('* * * * *', async () => {
    const now = new Date();
    const tenMinutesFromNow = new Date(now.getTime() + 10 * 60 * 1000);
    const nineMinutesFromNow = new Date(now.getTime() + 9 * 60 * 1000);

    try {
      const alertLobbies = await Lobby.find({
        status: 'WAITING',
        'config.data_hora': { $gte: nineMinutesFromNow, $lte: tenMinutesFromNow },
      });

      alertLobbies.forEach(lobby => {
        const player_nicks = [
          lobby.config?.adm_nick,
          ...lobby.players.map(p => p.nick),
          ...lobby.waitlist.map(p => p.nick),
        ].filter(Boolean);
        io.emit('lobby_alert', {
          lobby_id: lobby.lobby_id,
          message: `A partida começa em 10 minutos! Mapa: ${lobby.config.mapa}`,
          player_nicks,
        });
      });

      const delayedLobbies = await Lobby.find({
        status: 'WAITING',
        'config.data_hora': { $lt: now },
      });

      delayedLobbies.forEach(lobby => {
        const player_nicks = [
          lobby.config?.adm_nick,
          ...lobby.players.map(p => p.nick),
          ...lobby.waitlist.map(p => p.nick),
        ].filter(Boolean);
        io.emit('lobby_delayed', {
          lobby_id: lobby.lobby_id,
          message: `A partida no mapa ${lobby.config.mapa} está atrasada.`,
          player_nicks,
        });
      });
    } catch (err) {
      console.error('[Scheduler] Erro ao verificar lobbies:', err.message);
    }
  });

  console.log('⏰ Scheduler de lobbies iniciado');
}

module.exports = { startScheduler };
