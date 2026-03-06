const express = require('express');
const router = express.Router();
const service = require('../services/lobby.service');
const { requireAuth } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Lobbies
 *   description: Gerenciamento de partidas
 */

/**
 * @swagger
 * /lobbies:
 *   get:
 *     tags: [Lobbies]
 *     summary: Listar todas as partidas
 *     description: Retorna todas as partidas em ordem cronológica (ativas e canceladas).
 *     responses:
 *       200:
 *         description: Lista de lobbies
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Lobby'
 */
router.get('/', async (req, res) => {
  try {
    const lobbies = await service.getLobbies();
    res.json(lobbies);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /lobbies/{id}:
 *   get:
 *     tags: [Lobbies]
 *     summary: Buscar partida por ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: lobby_id (UUID)
 *     responses:
 *       200:
 *         description: Dados da partida
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Lobby'
 *       404:
 *         description: Lobby não encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id', async (req, res) => {
  try {
    const lobby = await service.getLobbyById(req.params.id);
    if (!lobby) return res.status(404).json({ error: 'Lobby não encontrado' });
    res.json(lobby);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /lobbies:
 *   post:
 *     tags: [Lobbies]
 *     summary: Criar nova partida
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [data_hora]
 *             properties:
 *               mapa:
 *                 type: string
 *                 example: Haven
 *               data_hora:
 *                 type: string
 *                 format: date-time
 *               max_players:
 *                 type: integer
 *                 minimum: 2
 *                 maximum: 10
 *                 default: 10
 *               waitlist_limit:
 *                 type: integer
 *                 default: 20
 *               adm_is_player:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       201:
 *         description: Partida criada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 lobby_id:
 *                   type: string
 *                   format: uuid
 *       401:
 *         description: Não autenticado
 */
router.post('/', requireAuth, async (req, res) => {
  try {
    const { mapa, data_hora, max_players, waitlist_limit, adm_is_player } = req.body;
    if (!data_hora) return res.status(400).json({ error: 'data_hora é obrigatório' });
    const lobby = await service.createLobby({
      mapa, data_hora, max_players, waitlist_limit, adm_is_player,
      adm_nick: req.user.nick,
      adm_user_id: req.user.id,
    });
    req.io.to(lobby.lobby_id).emit('lobby_updated', lobby);
    res.status(201).json({ lobby_id: lobby.lobby_id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /lobbies/{id}/join:
 *   post:
 *     tags: [Lobbies]
 *     summary: Entrar na partida
 *     description: Adiciona o usuário autenticado aos titulares (se houver vaga) ou à lista de espera.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lobby atualizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Lobby'
 *       400:
 *         description: Lobby lotado, partida cancelada ou usuário já presente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/:id/join', requireAuth, async (req, res) => {
  try {
    const lobby = await service.joinLobby(req.params.id, { nick: req.user.nick });
    req.io.to(req.params.id).emit('lobby_updated', lobby);
    res.json(lobby);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * @swagger
 * /lobbies/{id}/checkin:
 *   post:
 *     tags: [Lobbies]
 *     summary: Confirmar presença de jogador (ADM)
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nick]
 *             properties:
 *               nick:
 *                 type: string
 *     responses:
 *       200:
 *         description: Lobby atualizado com presença confirmada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Lobby'
 *       400:
 *         description: Jogador não encontrado ou sem permissão
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/:id/checkin', requireAuth, async (req, res) => {
  try {
    const { nick } = req.body;
    if (!nick) return res.status(400).json({ error: 'nick é obrigatório' });
    const lobby = await service.confirmCheckin(req.params.id, nick, req.user.id);
    req.io.to(req.params.id).emit('lobby_updated', lobby);
    res.json(lobby);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * @swagger
 * /lobbies/{id}/kick:
 *   post:
 *     tags: [Lobbies]
 *     summary: Remover jogador da partida (ADM)
 *     description: Remove o jogador dos titulares, promove o primeiro da fila e coloca o removido no fim da espera.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nick]
 *             properties:
 *               nick:
 *                 type: string
 *     responses:
 *       200:
 *         description: Lobby atualizado após remoção
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Lobby'
 *       400:
 *         description: Jogador não encontrado ou sem permissão
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/:id/kick', requireAuth, async (req, res) => {
  try {
    const { nick } = req.body;
    if (!nick) return res.status(400).json({ error: 'nick é obrigatório' });
    const lobby = await service.kickPlayer(req.params.id, nick, req.user.id);
    req.io.to(req.params.id).emit('lobby_updated', lobby);
    res.json(lobby);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * @swagger
 * /lobbies/{id}/toggle-player:
 *   post:
 *     tags: [Lobbies]
 *     summary: ADM alterna participação como jogador
 *     description: Se o ADM está nos titulares, sai e promove o primeiro da fila. Se não está, entra (requer vaga).
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lobby atualizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Lobby'
 *       400:
 *         description: Sem permissão ou sem vagas
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/:id/toggle-player', requireAuth, async (req, res) => {
  try {
    const lobby = await service.admTogglePlayer(req.params.id, req.user.id);
    req.io.to(req.params.id).emit('lobby_updated', lobby);
    res.json(lobby);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * @swagger
 * /lobbies/{id}/cancel:
 *   post:
 *     tags: [Lobbies]
 *     summary: Cancelar partida (ADM)
 *     description: Muda o status para cancelled. A partida ainda aparece na timeline mas não bloqueia o horário.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Partida cancelada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Lobby'
 *       400:
 *         description: Sem permissão ou partida já cancelada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/:id/cancel', requireAuth, async (req, res) => {
  try {
    const lobby = await service.cancelLobby(req.params.id, req.user.id);
    req.io.to(req.params.id).emit('lobby_updated', lobby);
    res.json(lobby);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * @swagger
 * /lobbies/{id}:
 *   patch:
 *     tags: [Lobbies]
 *     summary: Editar configurações da partida (ADM)
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               mapa:
 *                 type: string
 *               waitlist_limit:
 *                 type: integer
 *               max_players:
 *                 type: integer
 *                 minimum: 2
 *                 maximum: 10
 *     responses:
 *       200:
 *         description: Lobby atualizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Lobby'
 *       400:
 *         description: Sem permissão ou valor inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.patch('/:id', requireAuth, async (req, res) => {
  try {
    const lobby = await service.updateConfig(req.params.id, req.body, req.user.id);
    req.io.to(req.params.id).emit('lobby_updated', lobby);
    res.json(lobby);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * @swagger
 * /lobbies/{id}/start:
 *   post:
 *     tags: [Lobbies]
 *     summary: Iniciar partida (ADM)
 *     description: Muda status para IN_GAME e registra startedAt. Só disponível quando status é WAITING.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Partida iniciada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Lobby'
 *       400:
 *         description: Sem permissão ou status inválido
 */
router.post('/:id/start', requireAuth, async (req, res) => {
  try {
    const lobby = await service.startMatch(req.params.id, req.user.id);
    req.io.to(req.params.id).emit('lobby_updated', lobby);
    res.json(lobby);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * @swagger
 * /lobbies/{id}/next:
 *   post:
 *     tags: [Lobbies]
 *     summary: Avançar para próxima partida (ADM)
 *     description: Incrementa matchCount, volta status para WAITING. Só disponível quando status é IN_GAME.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Avançado para próxima partida
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Lobby'
 *       400:
 *         description: Sem permissão ou status inválido
 */
router.post('/:id/next', requireAuth, async (req, res) => {
  try {
    const lobby = await service.nextMatch(req.params.id, req.user.id);
    req.io.to(req.params.id).emit('lobby_updated', lobby);
    res.json(lobby);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * @swagger
 * /lobbies/{id}/leave:
 *   delete:
 *     tags: [Lobbies]
 *     summary: Sair da partida voluntariamente
 *     description: Remove o usuário autenticado dos jogadores ou da lista de espera. Se era jogador, promove o primeiro da waitlist.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lobby atualizado após saída
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Lobby'
 *       400:
 *         description: Não está na partida, partida encerrada ou ADM não pode sair
 */
router.delete('/:id/leave', requireAuth, async (req, res) => {
  try {
    const lobby = await service.leaveLobby(req.params.id, req.user.nick, req.user.id);
    req.io.to(req.params.id).emit('lobby_updated', lobby);
    res.json(lobby);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * @swagger
 * /lobbies/{id}/join:
 *   put:
 *     tags: [Lobbies]
 *     summary: Alternar posição (titulares ↔ lista de espera)
 *     description: Se o usuário está nos titulares, move para o fim da lista de espera (promovendo o primeiro da fila). Se está na lista de espera e há vaga, move para os titulares.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lobby atualizado após alternância
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Lobby'
 *       400:
 *         description: Sem permissão, sem vagas ou lista de espera cheia
 */
router.put('/:id/join', requireAuth, async (req, res) => {
  try {
    const lobby = await service.togglePosition(req.params.id, req.user.nick);
    req.io.to(req.params.id).emit('lobby_updated', lobby);
    res.json(lobby);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * @swagger
 * /lobbies/{id}/custom-code:
 *   post:
 *     tags: [Lobbies]
 *     summary: Definir código personalizado da partida (ADM)
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *     responses:
 *       200:
 *         description: Código salvo com sucesso
 *       400:
 *         description: Sem permissão
 */
router.post('/:id/custom-code', requireAuth, async (req, res) => {
  try {
    const { code } = req.body;
    await service.setCustomCode(req.params.id, code, req.user.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * @swagger
 * /lobbies/{id}/custom-code:
 *   get:
 *     tags: [Lobbies]
 *     summary: Obter código personalizado (somente titulares quando IN_GAME)
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Código personalizado
 *       403:
 *         description: Acesso negado (não é titular ou partida não iniciada)
 */
router.get('/:id/custom-code', requireAuth, async (req, res) => {
  try {
    const lobby = await service.getLobbyById(req.params.id);
    if (!lobby) return res.status(404).json({ error: 'Lobby não encontrado' });

    if (lobby.status !== 'IN_GAME') {
      return res.status(403).json({ error: 'O código só é revelado quando a partida estiver em andamento' });
    }

    const isPlayer = lobby.players.some(p => p.nick === req.user.nick);
    if (!isPlayer) {
      return res.status(403).json({ error: 'Apenas jogadores titulares podem ver o código' });
    }

    res.json({ code: lobby.custom_code });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
