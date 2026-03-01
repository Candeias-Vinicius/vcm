const Lobby = require('../models/Lobby');

function findById(lobby_id) {
  return Lobby.findOne({ lobby_id });
}

function findAll() {
  return Lobby.find({}).sort({ 'config.data_hora': 1 });
}

function create(data) {
  return Lobby.create(data);
}

function save(lobby) {
  return lobby.save();
}

module.exports = { findById, findAll, create, save };
