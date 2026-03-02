import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Users, Plus, Calendar, LogOut } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import CreateLobbyModal from '../components/Calendar/CreateLobbyModal';
import { formatDate, formatTime, formatWeekday } from '../utils/date';

const MAPS = ['Haven', 'Bind', 'Split', 'Ascent', 'Icebox', 'Breeze', 'Fracture', 'Pearl', 'Lotus', 'Sunset', 'Abyss', 'Corrode'];

const MAP_IMAGE = Object.fromEntries(
  MAPS.map(m => [m, `/maps/${m.toLowerCase()}.webp`])
);

const STATUS_BADGE = {
  WAITING:   { label: 'Aguardando', cls: 'bg-green-900/80 text-green-300' },
  IN_GAME:   { label: 'Em jogo',    cls: 'bg-yellow-900/80 text-yellow-300' },
  FINISHED:  { label: 'Encerrada',  cls: 'bg-gray-900/80 text-gray-400' },
  CANCELLED: { label: 'Cancelada',  cls: 'bg-red-900/80 text-red-400' },
};

function isFull(lobby) {
  const max = lobby.config?.max_players ?? 10;
  return lobby.players.length >= max;
}

export default function LobbyPage() {
  const { user, logout } = useAuth();
  const [lobbies, setLobbies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    api.getLobbies()
      .then(setLobbies)
      .catch(() => setLobbies([]))
      .finally(() => setLoading(false));
  }, []);

  async function handleCreate(payload) {
    try {
      const { lobby_id } = await api.createLobby(payload);
      setShowCreate(false);
      navigate(`/admin/${lobby_id}`);
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleLogout() {
    await logout();
  }

  return (
    <div className="min-h-screen bg-valorant-dark">
      {/* Header */}
      <div className="bg-valorant-card border-b border-valorant-border px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <h1 className="text-valorant-red font-bold text-xl uppercase tracking-widest">VCM</h1>
          {user && <span className="text-gray-500 text-xs hidden sm:block">· {user.nick}</span>}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1 bg-valorant-red hover:bg-red-500 transition-colors text-white text-sm font-bold px-3 py-2 rounded-lg"
          >
            <Plus size={16} /> Nova Sala
          </button>
          <button
            onClick={handleLogout}
            title="Sair"
            className="text-gray-500 hover:text-white p-2 rounded-lg hover:bg-valorant-card transition-colors"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>

      {/* Lobby list */}
      <div className="px-4 py-4 flex flex-col gap-3">
        {loading && <p className="text-gray-400 text-center py-12">Carregando...</p>}
        {!loading && lobbies.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-16 text-gray-500">
            <Calendar size={40} className="opacity-30" />
            <p className="text-sm">Nenhuma partida agendada ainda.</p>
            <p className="text-xs text-gray-600">Crie uma nova sala para começar!</p>
          </div>
        )}
        {lobbies.map((lobby) => {
          const full = isFull(lobby);
          const adm = lobby.config?.adm_nick || '?';
          const totalPlayers = lobby.players.length;
          const maxPlayers = lobby.config?.max_players ?? 10;
          const waitlistLimit = lobby.config?.waitlist_limit ?? 20;
          const badge = STATUS_BADGE[lobby.status] || STATUS_BADGE.WAITING;
          const inactive = lobby.status === 'FINISHED' || lobby.status === 'CANCELLED';
          const weekday = formatWeekday(lobby.config.data_hora);
          const date = formatDate(lobby.config.data_hora);
          const time = formatTime(lobby.config.data_hora);
          const mapImg = MAP_IMAGE[lobby.config.mapa] || `/maps/haven.webp`;
          return (
            <div
              key={lobby.lobby_id}
              onClick={() => navigate(`/match/${lobby.lobby_id}`)}
              className={`bg-valorant-card border border-valorant-border rounded-xl overflow-hidden cursor-pointer transition-all ${
                inactive ? 'opacity-50' : 'hover:border-valorant-red/60 active:scale-[0.99]'
              }`}
            >
              {/* Banner do mapa */}
              <div className="relative h-28 w-full">
                <img
                  src={mapImg}
                  alt={lobby.config.mapa}
                  className="w-full h-full object-cover"
                />
                {/* Gradiente sobre a imagem */}
                <div className="absolute inset-0 bg-gradient-to-t from-valorant-card via-valorant-card/40 to-transparent" />
                {/* Badge de status */}
                <span className={`absolute top-2 right-2 text-xs font-bold px-2 py-1 rounded-full backdrop-blur-sm ${badge.cls}`}>
                  {badge.label}
                  {full && lobby.status === 'WAITING' ? ' · Lotado' : ''}
                </span>
                {/* Nome do mapa sobre a imagem */}
                <div className="absolute bottom-2 left-3">
                  <span className="text-white font-bold text-lg drop-shadow-lg">{lobby.config.mapa}</span>
                </div>
              </div>

              {/* Info abaixo do banner */}
              <div className="px-4 py-3 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-1.5 text-gray-400 text-xs">
                      <Calendar size={11} />
                      <span>{weekday}, {date}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-gray-200 text-sm font-semibold">
                      <Clock size={12} />
                      <span>{time}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-0.5">
                    <div className="flex items-center gap-1.5 text-gray-400 text-sm">
                      <Users size={14} />
                      <span>Vagas: <span className="font-semibold text-white">{totalPlayers}</span>/{maxPlayers}</span>
                    </div>
                    <span className="text-gray-600 text-xs">Espera: {lobby.waitlist.length}/{waitlistLimit}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-valorant-border/40">
                  <span className="text-gray-500 text-xs">ADM: <span className="text-gray-300">{adm}</span></span>
                  {lobby.match_count > 0 && (
                    <span className="text-gray-500 text-xs">Partida #{lobby.match_count + 1}</span>
                  )}
                  <span className="text-valorant-red text-xs font-bold">Ver →</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {showCreate && (
        <CreateLobbyModal maps={MAPS} onClose={() => setShowCreate(false)} onCreate={handleCreate} />
      )}
    </div>
  );
}
