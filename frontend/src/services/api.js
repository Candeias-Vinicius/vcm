const API_BASE = import.meta.env.VITE_API_URL || '';
const BASE = `${API_BASE}/api/lobbies`;
const AUTH = `${API_BASE}/api/auth`;

async function request(url, options = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    credentials: 'include',
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Erro na requisição');
  return data;
}

export const api = {
  /**
   * Cadastrar novo usuário.
   * @param {string} nick - Nickname único (2–20 chars)
   * @param {string} email - E-mail único
   * @param {string} password - Senha (mín. 6 chars)
   * @returns {{ user: { id, nick, email } }}
   */
  register: (nick, email, password) =>
    request(`${AUTH}/register`, { method: 'POST', body: { nick, email, password } }),

  /**
   * Entrar com e-mail ou nickname.
   * @param {string} login - E-mail ou nickname
   * @param {string} password
   * @returns {{ user: { id, nick, email } }}
   */
  login: (login, password) =>
    request(`${AUTH}/login`, { method: 'POST', body: { login, password } }),

  /** Encerrar sessão (limpa o cookie). */
  logout: () =>
    request(`${AUTH}/logout`, { method: 'POST' }),

  /**
   * Retornar usuário autenticado a partir do cookie.
   * @returns {{ user: { id, nick, email } }}
   */
  me: () =>
    request(`${AUTH}/me`),

  /**
   * Solicitar link de redefinição de senha.
   * @param {string} email
   */
  forgotPassword: (email) =>
    request(`${AUTH}/forgot-password`, { method: 'POST', body: { email } }),

  /**
   * Redefinir senha usando o token recebido por e-mail.
   * @param {string} email
   * @param {string} token - UUID recebido no e-mail
   * @param {string} newPassword - Nova senha (mín. 6 chars)
   */
  resetPassword: (email, token, newPassword) =>
    request(`${AUTH}/reset-password`, { method: 'POST', body: { email, token, newPassword } }),

  /**
   * Listar todas as partidas em ordem cronológica.
   * @returns {Lobby[]}
   */
  getLobbies: () => request(BASE),

  /**
   * Buscar uma partida pelo ID.
   * @param {string} id - lobby_id (UUID)
   * @returns {Lobby}
   */
  getLobby: (id) => request(`${BASE}/${id}`),

  /**
   * Criar nova partida.
   * @param {{ mapa, data_hora, total_partidas, max_players, adm_is_player }} payload
   * @returns {{ lobby_id: string }}
   */
  createLobby: (payload) =>
    request(BASE, { method: 'POST', body: payload }),

  /**
   * Entrar na partida (titular ou lista de espera).
   * @param {string} id - lobby_id
   * @returns {Lobby}
   */
  joinLobby: (id) =>
    request(`${BASE}/${id}/join`, { method: 'POST' }),

  /**
   * Confirmar presença de jogador (somente ADM).
   * @param {string} id - lobby_id
   * @param {string} nick - Nick do jogador
   * @returns {Lobby}
   */
  confirmCheckin: (id, nick) =>
    request(`${BASE}/${id}/checkin`, { method: 'POST', body: { nick } }),

  /**
   * Remover jogador da partida (somente ADM).
   * Promove o primeiro da fila e coloca o removido no fim.
   * @param {string} id - lobby_id
   * @param {string} nick - Nick do jogador
   * @returns {Lobby}
   */
  kickPlayer: (id, nick) =>
    request(`${BASE}/${id}/kick`, { method: 'POST', body: { nick } }),

  /**
   * ADM alterna sua participação como jogador.
   * @param {string} id - lobby_id
   * @returns {Lobby}
   */
  admTogglePlayer: (id) =>
    request(`${BASE}/${id}/toggle-player`, { method: 'POST' }),

  /**
   * Cancelar partida (somente ADM). Continua visível na timeline.
   * @param {string} id - lobby_id
   * @returns {Lobby}
   */
  cancelLobby: (id) =>
    request(`${BASE}/${id}/cancel`, { method: 'POST' }),

  /**
   * Editar configurações da partida (somente ADM).
   * @param {string} id - lobby_id
   * @param {{ mapa?, waitlist_limit?, max_players? }} updates
   * @returns {Lobby}
   */
  updateConfig: (id, updates) =>
    request(`${BASE}/${id}`, { method: 'PATCH', body: updates }),

  /**
   * Iniciar partida (somente ADM). Status: WAITING → IN_GAME.
   * @param {string} id - lobby_id
   * @returns {Lobby}
   */
  startMatch: (id) =>
    request(`${BASE}/${id}/start`, { method: 'POST' }),

  /**
   * Avançar para próxima partida (somente ADM). Status: IN_GAME → WAITING.
   * @param {string} id - lobby_id
   * @returns {Lobby}
   */
  nextMatch: (id) =>
    request(`${BASE}/${id}/next`, { method: 'POST' }),

  /**
   * Alternar posição entre titulares e lista de espera.
   * Titulares → fim da fila (promove primeiro da waitlist). Waitlist → titulares (se houver vaga).
   * @param {string} id - lobby_id
   * @returns {Lobby}
   */
  togglePosition: (id) =>
    request(`${BASE}/${id}/join`, { method: 'PUT' }),

  /**
   * Sair da partida voluntariamente. Remove o usuário de players ou waitlist.
   * @param {string} id - lobby_id
   * @returns {Lobby}
   */
  leaveMatch: (id) =>
    request(`${BASE}/${id}/leave`, { method: 'DELETE' }),

  /**
   * ADM define o código personalizado da partida Valorant.
   * @param {string} id - lobby_id
   * @param {string} code - Código da partida personalizada
   */
  setCustomCode: (id, code) =>
    request(`${BASE}/${id}/custom-code`, { method: 'POST', body: { code } }),

  /**
   * Obtém o código personalizado (somente titulares IN_GAME).
   * @param {string} id - lobby_id
   * @returns {{ code: string }}
   */
  getCustomCode: (id) =>
    request(`${BASE}/${id}/custom-code`),
};
