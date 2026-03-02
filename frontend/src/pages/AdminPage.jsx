import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, CheckCircle, Edit2, Save, X, Users, XCircle, UserPlus, UserMinus, Play, SkipForward,
} from 'lucide-react';
import { api } from '../services/api';
import { useSocket } from '../hooks/useSocket';
import { useAuth } from '../context/AuthContext';

const MAP_IMAGE = {
  Haven: '/maps/haven.webp', Bind: '/maps/bind.webp', Split: '/maps/split.webp',
  Ascent: '/maps/ascent.webp', Icebox: '/maps/icebox.webp', Breeze: '/maps/breeze.webp',
  Fracture: '/maps/fracture.webp', Pearl: '/maps/pearl.webp', Lotus: '/maps/lotus.webp',
  Sunset: '/maps/sunset.webp', Abyss: '/maps/abyss.webp', Corrode: '/maps/corrode.webp',
};

const MAPS = ['Haven', 'Bind', 'Split', 'Ascent', 'Icebox', 'Breeze', 'Fracture', 'Pearl', 'Lotus', 'Sunset', 'Abyss', 'Corrode'];

export default function AdminPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [lobby, setLobby] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [busy, setBusy] = useState(false);

  const handleUpdate = useCallback((data) => {
    setLobby(data);
    setEditForm(f => ({
      mapa: data.config.mapa,
      waitlist_limit: data.config.waitlist_limit ?? 20,
      max_players: data.config.max_players ?? 10,
    }));
  }, []);
  useSocket(id, handleUpdate);

  useEffect(() => {
    api.getLobby(id)
      .then((data) => {
        setLobby(data);
        setEditForm({ mapa: data.config.mapa, waitlist_limit: data.config.waitlist_limit ?? 20, max_players: data.config.max_players ?? 10 });
      })
      .catch(() => navigate('/'))
      .finally(() => setLoading(false));
  }, [id]);

  // Redireciona se não for admin
  useEffect(() => {
    if (!loading && lobby && user && user.id !== lobby.adm_user_id) {
      navigate(`/match/${id}`, { replace: true });
    }
  }, [loading, lobby, user]);

  async function run(fn) {
    setBusy(true);
    try { await fn(); } catch (err) { alert(err.message); } finally { setBusy(false); }
  }

  const handleCheckin = (playerNick) => run(async () => {
    const updated = await api.confirmCheckin(id, playerNick);
    setLobby(updated);
  });

  const handleKick = (playerNick) => {
    if (!window.confirm(`Remover ${playerNick} da partida?`)) return;
    run(async () => {
      const updated = await api.kickPlayer(id, playerNick);
      setLobby(updated);
    });
  };

  const handleTogglePlayer = () => run(async () => {
    const updated = await api.admTogglePlayer(id);
    setLobby(updated);
  });

  const handleCancel = () => {
    if (!window.confirm('Cancelar esta partida? Ela ainda ficará visível no histórico.')) return;
    run(async () => {
      const updated = await api.cancelLobby(id);
      setLobby(updated);
    });
  };

  const handleStart = () => run(async () => {
    const updated = await api.startMatch(id);
    setLobby(updated);
  });

  const handleNext = () => run(async () => {
    const updated = await api.nextMatch(id);
    setLobby(updated);
  });

  const handleSaveConfig = () => run(async () => {
    const updated = await api.updateConfig(id, editForm);
    setLobby(updated);
    setEditing(false);
  });

  if (loading) return (
    <div className="min-h-screen bg-valorant-dark flex items-center justify-center text-gray-400">
      Carregando...
    </div>
  );
  if (!lobby) return null;

  const { config, players, waitlist, status, match_count } = lobby;
  const cancelled = status === 'CANCELLED';
  const finished = status === 'FINISHED';
  const inactive = cancelled || finished;
  const admIsPlayer = players.some(p => p.is_adm);

  return (
    <div className="min-h-screen bg-valorant-dark pb-8">
      {/* Banner do mapa */}
      <div className="relative h-32 w-full">
        <img
          src={MAP_IMAGE[config.mapa] || '/maps/haven.webp'}
          alt={config.mapa}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-valorant-dark via-valorant-dark/50 to-black/30" />
        {/* Botão voltar */}
        <button
          onClick={() => navigate(`/match/${id}`)}
          className="absolute top-3 left-3 bg-black/50 backdrop-blur-sm text-white rounded-full p-1.5 hover:bg-black/70"
        >
          <ArrowLeft size={18} />
        </button>
        {/* Botão editar */}
        {!inactive && (
          <button
            onClick={() => setEditing(e => !e)}
            className="absolute top-3 right-3 bg-black/50 backdrop-blur-sm text-white rounded-full p-1.5 hover:bg-black/70"
          >
            {editing ? <X size={18} /> : <Edit2 size={18} />}
          </button>
        )}
        {/* Info */}
        <div className="absolute bottom-3 left-4 flex items-end justify-between w-full pr-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-white font-bold text-xl drop-shadow-lg">{config.mapa}</h2>
              <span className="text-xs bg-valorant-red/80 text-white px-2 py-0.5 rounded-full font-bold">ADM</span>
              {cancelled && (
                <span className="text-xs bg-red-900/80 text-red-300 border border-red-700 px-2 py-0.5 rounded-full">
                  Cancelada
                </span>
              )}
              {finished && (
                <span className="text-xs bg-gray-900/80 text-gray-400 border border-gray-700 px-2 py-0.5 rounded-full">
                  Encerrada
                </span>
              )}
              {status === 'IN_GAME' && (
                <span className="text-xs bg-yellow-900/80 text-yellow-300 border border-yellow-700 px-2 py-0.5 rounded-full">
                  Em jogo
                </span>
              )}
            </div>
            <div className="text-gray-300 text-xs mt-0.5">
              {match_count > 0 ? `Partida #${match_count + 1}` : 'Aguardando início'}
            </div>
          </div>
        </div>
      </div>

      {/* Aviso de cancelado */}
      {cancelled && (
        <div className="mx-4 mt-4 bg-red-900/30 border border-red-800 rounded-xl px-4 py-3 flex items-center gap-2 text-red-400 text-sm">
          <XCircle size={16} /> Esta partida foi cancelada.
        </div>
      )}
      {finished && (
        <div className="mx-4 mt-4 bg-gray-900/50 border border-gray-700 rounded-xl px-4 py-3 flex items-center gap-2 text-gray-400 text-sm">
          <XCircle size={16} /> Esta partida foi encerrada.
        </div>
      )}

      {/* Config editor */}
      {editing && !inactive && (
        <div className="mx-4 mt-4 bg-valorant-card border border-valorant-border rounded-xl p-4 flex flex-col gap-3">
          <h3 className="text-gray-400 text-sm font-bold uppercase tracking-wider">Editar Config</h3>
          <div>
            <label className="text-gray-500 text-xs mb-1 block">Mapa</label>
            <select
              value={editForm.mapa}
              onChange={e => setEditForm(f => ({ ...f, mapa: e.target.value }))}
              className="w-full bg-valorant-dark border border-valorant-border text-white px-3 py-2 rounded-lg text-sm"
            >
              {MAPS.map(m => <option key={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="text-gray-500 text-xs mb-1 block">Vagas (máx. jogadores)</label>
            <input
              type="number" min={2} max={10}
              value={editForm.max_players ?? 10}
              onChange={e => setEditForm(f => ({ ...f, max_players: Number(e.target.value) }))}
              className="w-full bg-valorant-dark border border-valorant-border text-white px-3 py-2 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="text-gray-500 text-xs mb-1 block">Limite da Lista de Espera</label>
            <input
              type="number" min={1} max={50}
              value={editForm.waitlist_limit ?? 20}
              onChange={e => setEditForm(f => ({ ...f, waitlist_limit: Number(e.target.value) }))}
              className="w-full bg-valorant-dark border border-valorant-border text-white px-3 py-2 rounded-lg text-sm"
            />
          </div>
          <button
            onClick={handleSaveConfig}
            disabled={busy}
            className="flex items-center justify-center gap-2 bg-valorant-red text-white font-bold py-2 rounded-lg text-sm"
          >
            <Save size={14} /> Salvar
          </button>
        </div>
      )}

      {/* Ações do ADM */}
      {!inactive && (
        <div className="mx-4 mt-4 flex flex-col gap-2">
          {/* Iniciar / Próxima Partida */}
          {status === 'WAITING' && (
            <button
              onClick={handleStart}
              disabled={busy}
              className="flex items-center justify-center gap-2 bg-green-800 hover:bg-green-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl text-sm transition-colors"
            >
              <Play size={16} /> Iniciar Partida
            </button>
          )}
          {status === 'IN_GAME' && (
            <button
              onClick={handleNext}
              disabled={busy}
              className="flex items-center justify-center gap-2 bg-yellow-800 hover:bg-yellow-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl text-sm transition-colors"
            >
              <SkipForward size={16} /> Próxima Partida
            </button>
          )}

          {/* ADM toggle jogador (entrar/sair) */}
          {admIsPlayer ? (
            <button
              onClick={handleTogglePlayer}
              disabled={busy}
              className="flex items-center justify-center gap-2 border border-blue-600 text-blue-400 hover:bg-blue-900 disabled:opacity-50 font-bold py-3 rounded-xl text-sm transition-colors"
            >
              <UserMinus size={16} />
              Sair como Jogador
            </button>
          ) : (
            <button
              onClick={handleTogglePlayer}
              disabled={busy || players.length >= (lobby?.config?.max_players ?? 10)}
              className="flex items-center justify-center gap-2 bg-blue-800 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl text-sm transition-colors"
            >
              <UserPlus size={16} />
              {players.length >= (lobby?.config?.max_players ?? 10) ? 'Sem vagas (lobby lotado)' : 'Entrar como Jogador'}
            </button>
          )}

          {/* Cancelar partida */}
          <button
            onClick={handleCancel}
            disabled={busy}
            className="flex items-center justify-center gap-2 bg-valorant-dark border border-red-800 hover:bg-red-900/30 text-red-400 font-bold py-3 rounded-xl text-sm transition-colors"
          >
            <XCircle size={16} /> Cancelar Partida
          </button>
        </div>
      )}

      {/* Lista de jogadores */}
      <div className="mx-4 mt-4">
        <h3 className="flex items-center gap-2 text-gray-400 text-sm font-bold uppercase tracking-wider mb-2">
          <Users size={14} /> Jogadores ({players.length}/{config?.max_players ?? 10}) · Espera ({waitlist.length}/{config?.waitlist_limit ?? 20})
        </h3>
        <div className="flex flex-col gap-2">
          {players.map(p => (
            <div key={p.nick} className="flex items-center justify-between gap-2 bg-valorant-dark border border-valorant-border rounded-lg px-3 py-2.5">
              <span className="text-white text-sm font-semibold flex items-center gap-1.5 truncate">
                {p.is_adm && <span className="text-valorant-red text-xs">[ADM]</span>}
                {p.nick}
              </span>
              <div className="flex items-center gap-2 flex-shrink-0">
                {p.is_present ? (
                  <CheckCircle size={16} className="text-green-400" />
                ) : (
                  !inactive && (
                    <button
                      onClick={() => handleCheckin(p.nick)}
                      disabled={busy}
                      className="text-xs bg-green-900 hover:bg-green-800 text-green-300 px-2 py-1 rounded"
                    >
                      ✓ Presente
                    </button>
                  )
                )}
                {!inactive && !p.is_adm && (
                  <button
                    onClick={() => handleKick(p.nick)}
                    disabled={busy}
                    className="text-xs bg-red-900/50 hover:bg-red-900 text-red-400 px-2 py-1 rounded"
                  >
                    Remover
                  </button>
                )}
              </div>
            </div>
          ))}
          {players.length === 0 && (
            <p className="text-gray-600 text-sm text-center py-3">Nenhum jogador ainda.</p>
          )}
        </div>
      </div>

      {/* Waitlist */}
      {waitlist.length > 0 && (
        <div className="mx-4 mt-4">
          <h3 className="text-gray-400 text-sm font-bold uppercase tracking-wider mb-2">
            Lista de Espera ({waitlist.length})
          </h3>
          <div className="flex flex-col gap-1.5">
            {waitlist.map((p, i) => (
              <div key={i} className="flex items-center gap-3 bg-valorant-dark border border-valorant-border rounded-lg px-3 py-2">
                <span className="text-gray-500 text-sm font-bold w-5 text-center">{i + 1}</span>
                <span className="text-white text-sm flex-1">{p.nick}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

