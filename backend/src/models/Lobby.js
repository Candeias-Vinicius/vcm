const mongoose = require('mongoose');

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
    status: {
      type: String,
      enum: ['WAITING', 'IN_GAME', 'FINISHED', 'CANCELLED'],
      default: 'WAITING',
    },
    match_count: { type: Number, default: 0 },
    started_at: { type: Date, default: null },
    expires_at: { type: Date, default: null },
    config: {
      mapa: { type: String, default: 'Haven' },
      data_hora: { type: Date, required: true },
      max_players: { type: Number, default: 10, min: 2, max: 10 },
      waitlist_limit: { type: Number, default: 20 },
      adm_nick: { type: String, required: true },
      adm_is_player: { type: Boolean, default: true },
    },
    players: { type: [playerSchema], default: [] },
    waitlist: { type: [waitlistEntrySchema], default: [] },
  },
  { timestamps: true }
);

lobbySchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });

lobbySchema.methods.assertAdmin = function (userId) {
  if (this.adm_user_id !== userId) {
    throw new Error('Acesso negado: você não é o ADM desta partida');
  }
};

lobbySchema.methods.assertActive = function () {
  if (this.status === 'CANCELLED') throw new Error('Esta partida foi cancelada');
  if (this.status === 'FINISHED') throw new Error('Esta partida já foi encerrada');
};

lobbySchema.methods.isFull = function () {
  return this.players.length >= this.config.max_players;
};

lobbySchema.methods.hasWaitlistRoom = function () {
  return this.waitlist.length < (this.config.waitlist_limit || 20);
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

lobbySchema.methods.togglePosition = function (nick) {
  this.assertActive();

  const playerIdx = this.players.findIndex(p => p.nick === nick);
  if (playerIdx !== -1) {
    if (!this.hasWaitlistRoom()) throw new Error('Lista de espera está cheia.');
    this.players.splice(playerIdx, 1);
    this.promoteFromWaitlist();
    this.waitlist.push({ nick, joined_at: new Date() });
    return;
  }

  const waitIdx = this.waitlist.findIndex(p => p.nick === nick);
  if (waitIdx !== -1) {
    if (this.isFull()) throw new Error('Sem vagas disponíveis nos titulares.');
    this.waitlist.splice(waitIdx, 1);
    // Restore is_adm flag if this is the ADM returning to players
    this.players.push({ nick, is_present: false, is_adm: this.config.adm_nick === nick });
    return;
  }

  throw new Error('Você não está nesta partida.');
};

lobbySchema.methods.leave = function (nick) {
  const playerIdx = this.players.findIndex(p => p.nick === nick);
  if (playerIdx !== -1) {
    if (this.players[playerIdx].is_adm) {
      throw new Error('O ADM não pode sair da partida. Cancele a partida ou remova-se como jogador.');
    }
    this.players.splice(playerIdx, 1);
    this.promoteFromWaitlist();
    return;
  }

  const waitIdx = this.waitlist.findIndex(p => p.nick === nick);
  if (waitIdx !== -1) {
    this.waitlist.splice(waitIdx, 1);
    return;
  }

  throw new Error('Você não está nesta partida');
};

// ADM leaving: transfers role to next player/waitlist or auto-cancels if nobody left.
// Returns the nick of the new ADM, or null if cancelled.
lobbySchema.methods.admLeave = function () {
  // Remove ADM from players (if they're playing)
  const playerIdx = this.players.findIndex(p => p.is_adm);
  if (playerIdx !== -1) {
    this.players.splice(playerIdx, 1);
    this.promoteFromWaitlist();
  } else {
    // ADM might be in waitlist (went there via togglePosition)
    const waitIdx = this.waitlist.findIndex(p => p.nick === this.config.adm_nick);
    if (waitIdx !== -1) {
      this.waitlist.splice(waitIdx, 1);
    }
    // If ADM is pure observer (not in players or waitlist), nothing to remove
  }

  // Find next candidate: first non-ADM player, then first waitlist entry
  const nextPlayer = this.players.find(p => !p.is_adm);
  if (nextPlayer) {
    nextPlayer.is_adm = true;
    return nextPlayer.nick;
  }

  const nextWaiter = this.waitlist[0];
  if (nextWaiter) {
    return nextWaiter.nick;
  }

  // Nobody left — auto-cancel
  this.cancel();
  return null;
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

lobbySchema.methods.start = function () {
  if (this.status !== 'WAITING') throw new Error('A partida só pode ser iniciada quando estiver aguardando (WAITING)');
  this.status = 'IN_GAME';
  this.started_at = new Date();
};

lobbySchema.methods.nextMatch = function () {
  if (this.status !== 'IN_GAME') throw new Error('Só é possível avançar para a próxima partida durante uma em andamento (IN_GAME)');
  this.match_count += 1;
  this.status = 'WAITING';
  this.started_at = null;
};

lobbySchema.methods.finish = function () {
  this.status = 'FINISHED';
  this.expires_at = new Date(Date.now() + 86400000);
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
  if (this.status === 'CANCELLED') throw new Error('Partida já está cancelada');
  this.status = 'CANCELLED';
  this.expires_at = new Date(Date.now() + 86400000);
};

lobbySchema.methods.updateConfig = function (updates) {
  if (updates.mapa !== undefined) this.config.mapa = updates.mapa;
  if (updates.waitlist_limit !== undefined) {
    const wl = Math.max(1, Number(updates.waitlist_limit));
    this.config.waitlist_limit = wl;
  }
  if (updates.max_players !== undefined) {
    const v = Math.min(10, Math.max(2, Number(updates.max_players)));
    if (v < this.players.length) {
      throw new Error(`Não é possível reduzir para ${v} vagas — há ${this.players.length} jogadores ativos`);
    }
    this.config.max_players = v;
  }
};

module.exports = mongoose.model('Lobby', lobbySchema);
