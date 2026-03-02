import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, CheckCircle, Clock, Users, Shield, XCircle, Share2, LogOut,
  Play, Edit2, SkipForward,
} from 'lucide-react';
import { api } from '../services/api';
import { useSocket } from '../hooks/useSocket';
import { useAuth } from '../context/AuthContext';
import { formatFull, formatTime } from '../utils/date';
import EditConfigModal from '../components/EditConfigModal';

function PlayerCard({ player, isCurrentUser, isAdm, onCheckin, onKick, busy, inactive }) {
  return (
    <div
      className={`rounded-lg px-3 py-2.5 flex items-center gap-2 ${
        isCurrentUser
          ? 'bg-valorant-red/20 border border-valorant-red'
          : 'bg-valorant-card border border-valorant-border'
      }`}
    >
      <span className="text-white text-sm font-semibold flex-1 flex items-center gap-1.5 truncate min-w-0">
        {player.is_adm && <Shield size={12} className="text-valorant-red flex-shrink-0" />}
        <span className="truncate">{player.nick}</span>
      </span>
      <div className="flex items-center gap-1 flex-shrink-0">
        {player.is_present ? (
          <CheckCircle size={15} className="text-green-400" />
        ) : (
          isAdm && !inactive && (
            <button
              onClick={() => onCheckin(player.nick)}
              disabled={busy}
              title="Confirmar presença"
              className="text-xs bg-green-900 hover:bg-green-800 text-green-300 px-2 py-0.5 rounded"
            >
              ✓
            </button>
          )
        )}
        {isAdm && !inactive && !player.is_adm && (
          <button
            onClick={() => onKick(player.nick)}
            disabled={busy}
            title="Remover jogador"
            className="text-xs bg-red-900/50 hover:bg-red-900 text-red-400 px-1.5 py-0.5 rounded"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}

function EmptySlot({ onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`rounded-lg px-3 py-2.5 border border-dashed text-xs font-semibold uppercase transition-colors ${
        disabled
          ? 'border-valorant-border text-gray-700 cursor-not-allowed'
          : 'border-valorant-border hover:border-valorant-red text-gray-500 hover:text-valorant-red'
      }`}
    >
      + Ocupar vaga
    </button>
  );
}

const MAP_IMAGE = {
  Haven: '/maps/haven.webp', Bind: '/maps/bind.webp', Split: '/maps/split.webp',
  Ascent: '/maps/ascent.webp', Icebox: '/maps/icebox.webp', Breeze: '/maps/breeze.webp',
  Fracture: '/maps/fracture.webp', Pearl: '/maps/pearl.webp', Lotus: '/maps/lotus.webp',
  Sunset: '/maps/sunset.webp', Abyss: '/maps/abyss.webp', Corrode: '/maps/corrode.webp',
};

export default function MatchPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [lobby, setLobby] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);

  const handleUpdate = useCallback((data) => setLobby(data), []);
  useSocket(id, handleUpdate);

  useEffect(() => {
    api.getLobby(id)
      .then(setLobby)
      .catch(() => navigate('/'))
      .finally(() => setLoading(false));
  }, [id]);

  function isAlreadyIn() {
    if (!lobby || !user) return false;
    return [...lobby.players, ...lobby.waitlist].some(p => p.nick === user.nick);
  }

  async function handleJoin() {
    if (joining || isAlreadyIn()) return;
    setJoining(true);
    try {
      const updated = await api.joinLobby(id);
      setLobby(updated);
    } catch (err) {
      alert(err.message);
    } finally {
      setJoining(false);
    }
  }

  async function handleShare() {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleLeave() {
    if (!window.confirm('Sair desta partida?')) return;
    setLeaving(true);
    try {
      const updated = await api.leaveMatch(id);
      setLobby(updated);
    } catch (err) {
      alert(err.message);
    } finally {
      setLeaving(false);
    }
  }

  async function handleTogglePosition() {
    setToggling(true);
    try {
      const updated = await api.togglePosition(id);
      setLobby(updated);
    } catch (err) {
      alert(err.message);
    } finally {
      setToggling(false);
    }
  }

  async function run(fn) {
    setBusy(true);
    try { await fn(); } catch (err) { alert(err.message); } finally { setBusy(false); }
  }

  const handleCheckin = (nick) => run(async () => {
    const updated = await api.confirmCheckin(id, nick);
    setLobby(updated);
  });

  const handleKick = (nick) => {
    if (!window.confirm(`Remover ${nick} da partida?`)) return;
    run(async () => {
      const updated = await api.kickPlayer(id, nick);
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

  const handleCancel = () => {
    if (!window.confirm('Cancelar esta partida? Ela ainda ficará visível por 24h.')) return;
    run(async () => {
      const updated = await api.cancelLobby(id);
      setLobby(updated);
    });
  };

  const handleSaveConfig = async (form) => {
    setBusy(true);
    try {
      const updated = await api.updateConfig(id, form);
      setLobby(updated);
      setEditing(false);
    } catch (err) {
      alert(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-valorant-dark flex items-center justify-center text-gray-400">
      Carregando...
    </div>
  );
  if (!lobby) return null;

  const { config, players, waitlist, status, match_count, started_at } = lobby;
  const cancelled = status === 'CANCELLED';
  const finished = status === 'FINISHED';
  const inactive = cancelled || finished;
  const alreadyIn = isAlreadyIn();
  const maxPlayers = config?.max_players ?? 10;
  const waitlistLimit = config?.waitlist_limit ?? 20;
  const slots = Array.from({ length: maxPlayers }, (_, i) => players[i] || null);
  const isAdm = user && lobby.adm_user_id && user.id === lobby.adm_user_id;
  const isInPlayers = players.some(p => p.nick === user?.nick);
  const isInWaitlist = waitlist.some(p => p.nick === user?.nick);
  const isParticipant = isInPlayers || isInWaitlist;
  const hasOpenSlot = players.length < maxPlayers;

  return (
    <div className="min-h-screen bg-valorant-dark pb-8">
      {/* Banner do mapa */}
      <div className="relative h-36 w-full">
        <img
          src={MAP_IMAGE[config.mapa] || '/maps/haven.webp'}
          alt={config.mapa}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-valorant-dark via-valorant-dark/50 to-black/30" />

        <button
          onClick={() => navigate('/')}
          className="absolute top-3 left-3 bg-black/50 backdrop-blur-sm text-white rounded-full p-1.5 hover:bg-black/70"
        >
          <ArrowLeft size={18} />
        </button>

        <div className="absolute top-3 right-3 flex items-center gap-2">
          {isAdm && !inactive && (
            <button
              onClick={() => setEditing(true)}
              title="Editar sala"
              className="bg-black/50 backdrop-blur-sm text-white rounded-full p-1.5 hover:bg-black/70"
            >
              <Edit2 size={16} />
            </button>
          )}
          <button
            onClick={handleShare}
            className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg shadow transition-all ${
              copied ? 'bg-green-600 text-white' : 'bg-black/50 backdrop-blur-sm text-white hover:bg-black/70'
            }`}
          >
            <Share2 size={13} />
            {copied ? 'Copiado!' : 'Compartilhar'}
          </button>
        </div>

        <div className="absolute bottom-3 left-4">
          <div className="flex items-center gap-2">
            <h2 className="text-white font-bold text-2xl drop-shadow-lg">{config.mapa}</h2>
            {isAdm && (
              <span className="text-xs bg-valorant-red/80 text-white px-2 py-0.5 rounded-full font-bold">ADM</span>
            )}
            {status === 'IN_GAME' && (
              <span className="text-xs bg-yellow-900/80 text-yellow-300 border border-yellow-700 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                <Play size={9} fill="currentColor" /> Em jogo
              </span>
            )}
            {cancelled && (
              <span className="text-xs bg-red-900/80 text-red-300 border border-red-700 px-2 py-0.5 rounded-full font-semibold">
                Cancelada
              </span>
            )}
            {finished && (
              <span className="text-xs bg-gray-900/80 text-gray-400 border border-gray-700 px-2 py-0.5 rounded-full font-semibold">
                Encerrada
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-gray-300 text-xs mt-0.5">
            <Clock size={11} />
            {formatFull(config.data_hora)}
            {match_count > 0 && <span>· Partida #{match_count + 1}</span>}
          </div>
          {status === 'IN_GAME' && started_at && (
            <div className="text-yellow-400 text-xs mt-0.5">
              Iniciada às {formatTime(started_at)}
            </div>
          )}
        </div>
      </div>

      {/* Banners de status */}
      {cancelled && (
        <div className="mx-4 mt-4 bg-red-900/30 border border-red-800 rounded-xl px-4 py-3 flex items-center gap-2 text-red-400 text-sm">
          <XCircle size={16} /> Esta partida foi cancelada pelo administrador.
        </div>
      )}
      {finished && (
        <div className="mx-4 mt-4 bg-gray-900/50 border border-gray-700 rounded-xl px-4 py-3 flex items-center gap-2 text-gray-400 text-sm">
          <XCircle size={16} /> Esta partida foi encerrada.
        </div>
      )}

      {/* Controles do ADM */}
      {isAdm && !inactive && (
        <div className="mx-4 mt-4 flex flex-col gap-2">
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
          <button
            onClick={handleCancel}
            disabled={busy}
            className="flex items-center justify-center gap-2 border border-red-800 hover:bg-red-900/30 text-red-400 font-bold py-3 rounded-xl text-sm transition-colors"
          >
            <XCircle size={16} /> Cancelar Partida
          </button>
        </div>
      )}

      {/* Controles de posição — todos os participantes (inclusive ADM) */}
      {isParticipant && !inactive && (
        <div className="mx-4 mt-4 flex flex-col gap-2">
          {isInWaitlist && hasOpenSlot && (
            <button
              onClick={handleTogglePosition}
              disabled={toggling}
              className="w-full flex items-center justify-center gap-2 bg-blue-800 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl text-sm transition-colors disabled:opacity-50"
            >
              ↑ Entrar como Titular
            </button>
          )}
          {isInPlayers && (
            <button
              onClick={handleTogglePosition}
              disabled={toggling}
              className="w-full flex items-center justify-center gap-2 border border-blue-700 hover:bg-blue-900/30 text-blue-400 font-bold py-2.5 rounded-xl text-sm transition-colors disabled:opacity-50"
            >
              ↓ Ir para Lista de Espera
            </button>
          )}
          <button
            onClick={handleLeave}
            disabled={leaving}
            className="w-full flex items-center justify-center gap-2 border border-red-800 hover:bg-red-900/30 text-red-400 font-bold py-2.5 rounded-xl text-sm transition-colors disabled:opacity-50"
          >
            <LogOut size={15} /> Sair da Sala
          </button>
        </div>
      )}

      {/* Grade de jogadores */}
      <div className="px-4 py-4">
        <h3 className="flex items-center gap-2 text-gray-400 text-sm font-bold uppercase tracking-wider mb-3">
          <Users size={14} /> Jogadores ({players.length}/{maxPlayers}) · Espera ({waitlist.length}/{waitlistLimit})
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {slots.map((p, i) =>
            p ? (
              <PlayerCard
                key={i}
                player={p}
                isCurrentUser={p.nick === user?.nick}
                isAdm={isAdm}
                onCheckin={handleCheckin}
                onKick={handleKick}
                busy={busy}
                inactive={inactive}
              />
            ) : (
              <EmptySlot
                key={i}
                disabled={alreadyIn || inactive}
                onClick={handleJoin}
              />
            )
          )}
        </div>
      </div>

      {/* Lista de espera */}
      {(waitlist.length > 0 || players.length >= maxPlayers) && (
        <div className="px-4 py-2">
          <h3 className="flex items-center gap-2 text-gray-400 text-sm font-bold uppercase tracking-wider mb-3">
            <Users size={14} /> Lista de Espera ({waitlist.length}/{waitlistLimit})
          </h3>
          {waitlist.length === 0 ? (
            <p className="text-gray-600 text-sm text-center py-2">Lista de espera vazia.</p>
          ) : (
            <div className="flex flex-col gap-1.5">
              {waitlist.map((p, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-3 bg-valorant-card border rounded-lg px-3 py-2 ${
                    p.nick === user?.nick ? 'border-valorant-red' : 'border-valorant-border'
                  }`}
                >
                  <span className="text-gray-500 text-sm font-bold w-5 text-center">{i + 1}</span>
                  <span className="text-white text-sm flex-1">{p.nick}</span>
                  {p.nick === user?.nick && <CheckCircle size={14} className="text-valorant-red" />}
                </div>
              ))}
              {!alreadyIn && !inactive && waitlist.length < waitlistLimit && (
                <button
                  onClick={handleJoin}
                  disabled={joining}
                  className="border border-dashed border-valorant-border hover:border-valorant-red text-gray-500 hover:text-valorant-red transition-colors rounded-lg px-3 py-2 text-xs font-semibold uppercase text-center"
                >
                  + Entrar na fila de espera
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Modal de edição de config (ADM) */}
      {isAdm && (
        <EditConfigModal
          isOpen={editing}
          onClose={() => setEditing(false)}
          config={config}
          onSave={handleSaveConfig}
          busy={busy}
        />
      )}
    </div>
  );
}

