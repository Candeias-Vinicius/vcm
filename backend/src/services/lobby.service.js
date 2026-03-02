const { v4: uuidv4 } = require('uuid');
const lobbyRepo = require('../repositories/lobby.repository');
const userRepo = require('../repositories/user.repository');

function assertLobbyExists(lobby) {
  if (!lobby) throw new Error('Lobby não encontrado');
}

async function createLobby({ mapa, data_hora, max_players, waitlist_limit, adm_is_player, adm_nick, adm_user_id }) {
  const lobby_id = uuidv4();
  const cappedMax = Math.min(10, Math.max(2, Number(max_players) || 10));
  const cappedWaitlist = Math.max(1, Number(waitlist_limit) || 20);

  const players = adm_is_player
    ? [{ nick: adm_nick, is_present: true, is_adm: true }]
    : [];

  return lobbyRepo.create({
    lobby_id,
    adm_user_id,
    status: 'WAITING',
    config: { mapa, data_hora, max_players: cappedMax, waitlist_limit: cappedWaitlist, adm_nick, adm_is_player },
    players,
    waitlist: [],
  });
}

async function joinLobby(lobby_id, { nick }) {
  const lobby = await lobbyRepo.findById(lobby_id);
  assertLobbyExists(lobby);
  lobby.join(nick);
  return lobbyRepo.save(lobby);
}

async function confirmCheckin(lobby_id, nick, userId) {
  const lobby = await lobbyRepo.findById(lobby_id);
  assertLobbyExists(lobby);
  lobby.assertAdmin(userId);
  lobby.confirmCheckin(nick);
  return lobbyRepo.save(lobby);
}

async function kickPlayer(lobby_id, nick, userId) {
  const lobby = await lobbyRepo.findById(lobby_id);
  assertLobbyExists(lobby);
  lobby.assertAdmin(userId);
  lobby.kick(nick);
  return lobbyRepo.save(lobby);
}

async function admTogglePlayer(lobby_id, userId) {
  const lobby = await lobbyRepo.findById(lobby_id);
  assertLobbyExists(lobby);
  lobby.assertAdmin(userId);
  lobby.toggleAdmAsPlayer();
  return lobbyRepo.save(lobby);
}

async function cancelLobby(lobby_id, userId) {
  const lobby = await lobbyRepo.findById(lobby_id);
  assertLobbyExists(lobby);
  lobby.assertAdmin(userId);
  lobby.cancel();
  return lobbyRepo.save(lobby);
}

async function updateConfig(lobby_id, updates, userId) {
  const lobby = await lobbyRepo.findById(lobby_id);
  assertLobbyExists(lobby);
  lobby.assertAdmin(userId);
  lobby.updateConfig(updates);
  return lobbyRepo.save(lobby);
}

async function startMatch(lobby_id, userId) {
  const lobby = await lobbyRepo.findById(lobby_id);
  assertLobbyExists(lobby);
  lobby.assertAdmin(userId);
  lobby.start();
  return lobbyRepo.save(lobby);
}

async function nextMatch(lobby_id, userId) {
  const lobby = await lobbyRepo.findById(lobby_id);
  assertLobbyExists(lobby);
  lobby.assertAdmin(userId);
  lobby.nextMatch();
  return lobbyRepo.save(lobby);
}

async function leaveLobby(lobby_id, nick, userId) {
  const lobby = await lobbyRepo.findById(lobby_id);
  assertLobbyExists(lobby);
  lobby.assertActive();

  if (lobby.adm_user_id === userId) {
    // ADM is leaving — transfer role to next person or auto-cancel
    const transferNick = lobby.admLeave();
    if (transferNick) {
      const newAdm = await userRepo.findByNick(transferNick);
      if (newAdm) {
        lobby.adm_user_id = newAdm._id.toString();
        lobby.config.adm_nick = transferNick;
        // Ensure is_adm flag is set on the new ADM if they're in players
        const playerEntry = lobby.players.find(p => p.nick === transferNick);
        if (playerEntry) playerEntry.is_adm = true;
      }
    }
    // If transferNick is null, lobby.cancel() was already called inside admLeave()
  } else {
    lobby.leave(nick);
  }

  return lobbyRepo.save(lobby);
}

async function togglePosition(lobby_id, nick) {
  const lobby = await lobbyRepo.findById(lobby_id);
  assertLobbyExists(lobby);
  lobby.togglePosition(nick);
  return lobbyRepo.save(lobby);
}

function getLobbies() {
  return lobbyRepo.findAll();
}

function getLobbyById(lobby_id) {
  return lobbyRepo.findById(lobby_id);
}

module.exports = {
  createLobby,
  joinLobby,
  confirmCheckin,
  kickPlayer,
  admTogglePlayer,
  cancelLobby,
  updateConfig,
  startMatch,
  nextMatch,
  leaveLobby,
  togglePosition,
  getLobbies,
  getLobbyById,
};
