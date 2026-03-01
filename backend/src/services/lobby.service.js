const { v4: uuidv4 } = require('uuid');
const lobbyRepo = require('../repositories/lobby.repository');

function assertLobbyExists(lobby) {
  if (!lobby) throw new Error('Lobby não encontrado');
}

async function createLobby({ mapa, data_hora, total_partidas, max_players, adm_is_player, adm_nick, adm_user_id }) {
  const lobby_id = uuidv4();
  const cappedMax = Math.min(10, Math.max(2, Number(max_players) || 10));

  const players = adm_is_player
    ? [{ nick: adm_nick, is_present: true, is_adm: true }]
    : [];

  return lobbyRepo.create({
    lobby_id,
    adm_user_id,
    status: 'active',
    config: { mapa, data_hora, total_partidas, max_players: cappedMax, adm_nick, adm_is_player },
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
  getLobbies,
  getLobbyById,
};
