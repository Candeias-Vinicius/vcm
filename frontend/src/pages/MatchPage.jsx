import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Clock, Users, Shield, XCircle, Share2 } from 'lucide-react';
import { api } from '../services/api';
import { useSocket } from '../hooks/useSocket';
import { useAuth } from '../context/AuthContext';

function PlayerCard({ player, isCurrentUser }) {
  return (
    <div
      className={`rounded-lg px-3 py-2.5 flex items-center gap-3 ${
        isCurrentUser
          ? 'bg-valorant-red/20 border border-valorant-red'
          : 'bg-valorant-card border border-valorant-border'
      }`}
    >
      <span className="text-white text-sm font-semibold flex-1 flex items-center gap-1.5 truncate">
        {player.is_adm && <Shield size={12} className="text-valorant-red flex-shrink-0" />}
        {player.nick}
      </span>
      {player.is_present && <CheckCircle size={15} className="text-green-400 flex-shrink-0" />}
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
  const [copied, setCopied] = useState(false);

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

  if (loading) return (
    <div className="min-h-screen bg-valorant-dark flex items-center justify-center text-gray-400">
      Carregando...
    </div>
  );
  if (!lobby) return null;

  const { config, players, waitlist, status } = lobby;
  const cancelled = status === 'cancelled';
  const alreadyIn = isAlreadyIn();
  const maxPlayers = lobby?.config?.max_players ?? 10;
  const slots = Array.from({ length: maxPlayers }, (_, i) => players[i] || null);
  const isAdm = user && lobby.adm_user_id && user.id === lobby.adm_user_id;

  return (
    <div className="min-h-screen bg-valorant-dark">
      {/* Banner do mapa */}
      <div className="relative h-36 w-full">
        <img
          src={MAP_IMAGE[config.mapa] || '/maps/haven.webp'}
          alt={config.mapa}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-valorant-dark via-valorant-dark/50 to-black/30" />
        {/* Botão voltar */}
        <button
          onClick={() => navigate('/')}
          className="absolute top-3 left-3 bg-black/50 backdrop-blur-sm text-white rounded-full p-1.5 hover:bg-black/70"
        >
          <ArrowLeft size={18} />
        </button>
        {/* Botões do canto direito */}
        <div className="absolute top-3 right-3 flex items-center gap-2">
          <button
            onClick={handleShare}
            className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg shadow transition-all ${
              copied
                ? 'bg-green-600 text-white'
                : 'bg-black/50 backdrop-blur-sm text-white hover:bg-black/70'
            }`}
          >
            <Share2 size={13} />
            {copied ? 'Copiado!' : 'Compartilhar'}
          </button>
          {isAdm && (
            <button
              onClick={() => navigate(`/admin/${id}`)}
              className="bg-valorant-red text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow"
            >
              ADM
            </button>
          )}
        </div>
        {/* Info do mapa */}
        <div className="absolute bottom-3 left-4">
          <div className="flex items-center gap-2">
            <h2 className="text-white font-bold text-2xl drop-shadow-lg">{config.mapa}</h2>
            {cancelled && (
              <span className="text-xs bg-red-900/80 text-red-300 border border-red-700 px-2 py-0.5 rounded-full font-semibold">
                Cancelada
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-gray-300 text-xs mt-0.5">
            <Clock size={11} />
            {new Date(config.data_hora).toLocaleString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
            <span>· {config.total_partidas} partida(s)</span>
          </div>
        </div>
      </div>

      {cancelled && (
        <div className="mx-4 mt-4 bg-red-900/30 border border-red-800 rounded-xl px-4 py-3 flex items-center gap-2 text-red-400 text-sm">
          <XCircle size={16} />
          Esta partida foi cancelada pelo administrador.
        </div>
      )}

      {/* Players */}
      <div className="px-4 py-4">
        <h3 className="flex items-center gap-2 text-gray-400 text-sm font-bold uppercase tracking-wider mb-3">
          <Users size={14} /> Jogadores ({players.length}/{maxPlayers})
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {slots.map((p, i) =>
            p ? (
              <PlayerCard key={i} player={p} isCurrentUser={p.nick === user?.nick} />
            ) : (
              <EmptySlot
                key={i}
                disabled={alreadyIn || cancelled}
                onClick={handleJoin}
              />
            )
          )}
        </div>
      </div>

      {/* Waitlist */}
      {(waitlist.length > 0 || players.length >= maxPlayers) && (
        <div className="px-4 py-2">
          <h3 className="flex items-center gap-2 text-gray-400 text-sm font-bold uppercase tracking-wider mb-3">
            <Users size={14} /> Lista de Espera ({waitlist.length}/10)
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

              {/* Slot de entrar na espera */}
              {!alreadyIn && !cancelled && waitlist.length < 10 && (
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
    </div>
  );
}

