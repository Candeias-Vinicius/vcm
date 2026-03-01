const mongoose = require('mongoose');

const MAX_WAITLIST = 10;

const playerSchema = new mongoose.Schema({
  nick: { type: String, required: true },
  is_present: { type: Boolean, default: false },
  is_adm: { type: Boolean, default: false },
});

const waitlistEntrySchema = new mongoose.Schema({
  nick: { type: String, required: true },
  joined_at: { type: Date, default: Date.now },
});

const lobbySchema = new mongoose.Schema(
  {
    lobby_id: { type: String, required: true, unique: true },
    adm_user_id: { type: String, required: true },
    status: { type: String, enum: ['active', 'cancelled'], default: 'active' },
    config: {
      mapa: { type: String, default: 'Haven' },
      data_hora: { type: Date, required: true },
      total_partidas: { type: Number, default: 3 },
      max_players: { type: Number, default: 10, min: 2, max: 10 },
      adm_nick: { type: String, required: true },
      adm_is_player: { type: Boolean, default: true },
    },
    players: { type: [playerSchema], default: [] },
    waitlist: { type: [waitlistEntrySchema], default: [] },
  },
  { timestamps: true }
);

lobbySchema.methods.assertAdmin = function (userId) {
  if (this.adm_user_id !== userId) {
    throw new Error('Acesso negado: você não é o ADM desta partida');
  }
};

lobbySchema.methods.assertActive = function () {
  if (this.status === 'cancelled') throw new Error('Esta partida foi cancelada');
};

lobbySchema.methods.isFull = function () {
  return this.players.length >= this.config.max_players;
};

lobbySchema.methods.hasWaitlistRoom = function () {
  return this.waitlist.length < MAX_WAITLIST;
};

lobbySchema.methods.isAlreadyIn = function (nick) {
  return [...this.players, ...this.waitlist].some(p => p.nick === nick);
};

lobbySchema.methods.promoteFromWaitlist = function () {
  if (this.waitlist.length > 0) {
    const [promoted] = this.waitlist.splice(0, 1);
    this.players.push({ nick: promoted.nick, is_present: false, is_adm: false });
  }
};

lobbySchema.methods.join = function (nick) {
  this.assertActive();
  if (this.isAlreadyIn(nick)) throw new Error('Você já está neste lobby');

  if (this.isFull()) {
    if (!this.hasWaitlistRoom()) throw new Error('Lobby lotado — lista de espera também está cheia');
    this.waitlist.push({ nick, joined_at: new Date() });
  } else {
    this.players.push({ nick, is_present: false, is_adm: false });
  }
};

lobbySchema.methods.confirmCheckin = function (nick) {
  const player = this.players.find(p => p.nick === nick);
  if (!player) throw new Error('Jogador não encontrado na partida');
  player.is_present = true;
};

lobbySchema.methods.kick = function (nick) {
  const idx = this.players.findIndex(p => p.nick === nick);
  if (idx === -1) throw new Error('Jogador não encontrado na partida');

  const [kicked] = this.players.splice(idx, 1);
  this.promoteFromWaitlist();

  if (this.hasWaitlistRoom()) {
    this.waitlist.push({ nick: kicked.nick, joined_at: new Date() });
  }
};

lobbySchema.methods.toggleAdmAsPlayer = function () {
  const admIdx = this.players.findIndex(p => p.is_adm);

  if (admIdx !== -1) {
    this.players.splice(admIdx, 1);
    this.config.adm_is_player = false;
    this.promoteFromWaitlist();
  } else {
    if (this.isFull()) throw new Error('Sem vagas disponíveis');
    this.config.adm_is_player = true;
    this.players.push({ nick: this.config.adm_nick, is_present: true, is_adm: true });
  }
};

lobbySchema.methods.cancel = function () {
  if (this.status === 'cancelled') throw new Error('Partida já está cancelada');
  this.status = 'cancelled';
};

lobbySchema.methods.updateConfig = function (updates) {
  if (updates.mapa !== undefined) this.config.mapa = updates.mapa;
  if (updates.total_partidas !== undefined) this.config.total_partidas = updates.total_partidas;
  if (updates.max_players !== undefined) {
    const v = Math.min(10, Math.max(2, Number(updates.max_players)));
    if (v < this.players.length) {
      throw new Error(`Não é possível reduzir para ${v} vagas — há ${this.players.length} jogadores ativos`);
    }
    this.config.max_players = v;
  }
};

module.exports = mongoose.model('Lobby', lobbySchema);
