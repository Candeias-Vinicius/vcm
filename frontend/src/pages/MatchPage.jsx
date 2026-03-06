import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, CheckCircle, Clock, Users, Shield, XCircle, Share2, LogOut,
  Play, Edit2, SkipForward, Key, Eye, EyeOff,
} from 'lucide-react';
import { api } from '../services/api';
import { useSocket } from '../hooks/useSocket';
import { useAuth } from '../context/AuthContext';
import { useTutorial } from '../context/TutorialContext';
import { formatFull, formatTime } from '../utils/date';
import EditConfigModal from '../components/EditConfigModal';
import ChatBox from '../components/ChatBox';
import ConfirmDialog from '../components/ConfirmDialog';

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
  const { active: tutorialActive, mockLobby, nextStep } = useTutorial();
  const isTutorial = id === '__tutorial__';

  const [lobby, setLobby] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [customCode, setCustomCode] = useState('');
  const [customCodeInput, setCustomCodeInput] = useState('');
  const [savingCode, setSavingCode] = useState(false);
  const [codeVisible, setCodeVisible] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [confirmDialog, setConfirmDialog] = useState({ open: false, message: '', onConfirm: null, confirmLabel: 'Confirmar' });

  const handleUpdate = useCallback((data) => setLobby(data), []);
  const handleChatMessage = useCallback((msg) => setChatMessages(prev => [...prev, msg]), []);
  const handleChatHistory = useCallback((msgs) => setChatMessages(msgs), []);
  const { sendMessage } = useSocket(isTutorial ? null : id, handleUpdate, handleChatMessage, handleChatHistory);

  // Tutorial mode: use mock lobby directly
  useEffect(() => {
    if (isTutorial && mockLobby) {
      setLobby(mockLobby);
      setLoading(false);
    }
  }, [isTutorial, mockLobby]);

  useEffect(() => {
    if (isTutorial) return;
    api.getLobby(id)
      .then(setLobby)
      .catch(() => navigate('/'))
      .finally(() => setLoading(false));
  }, [id, isTutorial]);

  // Fetch custom code when IN_GAME and user is a player (skip in tutorial)
  useEffect(() => {
    if (isTutorial || !lobby || !user) return;
    const isPlayer = lobby.players.some(p => p.nick === user.nick);
    if (lobby.status === 'IN_GAME' && isPlayer) {
      api.getCustomCode(id)
        .then(({ code }) => setCustomCode(code || ''))
        .catch(() => setCustomCode(''));
    } else {
      setCustomCode('');
    }
  }, [lobby?.status, id, user, isTutorial]);

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

  function showConfirm(message, onConfirm, confirmLabel = 'Confirmar') {
    setConfirmDialog({ open: true, message, onConfirm, confirmLabel });
  }
  function closeConfirm() {
    setConfirmDialog(d => ({ ...d, open: false, onConfirm: null }));
  }
  function showError(msg) {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(''), 5000);
  }

  async function handleShare() {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleLeave() {
    showConfirm('Sair desta partida?', async () => {
      closeConfirm();
      setLeaving(true);
      try {
        const updated = await api.leaveMatch(id);
        setLobby(updated);
      } catch (err) {
        showError(err.message);
      } finally {
        setLeaving(false);
      }
    }, 'Sair');
  }

  async function handleTogglePosition() {
    setToggling(true);
    try {
      const updated = await api.togglePosition(id);
      setLobby(updated);
    } catch (err) {
      showError(err.message);
    } finally {
      setToggling(false);
    }
  }

  async function run(fn) {
    setBusy(true);
    try { await fn(); } catch (err) { showError(err.message); } finally { setBusy(false); }
  }

  const handleCheckin = (nick) => {
    if (isTutorial) return;
    run(async () => {
      const updated = await api.confirmCheckin(id, nick);
      setLobby(updated);
    });
  };

  const handleKick = (nick) => {
    if (isTutorial) return;
    showConfirm(`Remover ${nick} da partida?`, () => {
      closeConfirm();
      run(async () => {
        const updated = await api.kickPlayer(id, nick);
        setLobby(updated);
      });
    }, 'Remover');
  };

  const handleStart = () => {
    if (isTutorial) return;
    run(async () => {
      const updated = await api.startMatch(id);
      setLobby(updated);
    });
  };

  const handleNext = () => {
    if (isTutorial) return;
    run(async () => {
      const updated = await api.nextMatch(id);
      setLobby(updated);
      setCustomCode('');
      setCustomCodeInput('');
    });
  };

  const handleSaveCustomCode = async () => {
    if (isTutorial) { setCustomCode(customCodeInput.trim()); return; }
    setSavingCode(true);
    try {
      await api.setCustomCode(id, customCodeInput.trim());
      setCustomCode(customCodeInput.trim());
    } catch (err) {
      showError(err.message);
    } finally {
      setSavingCode(false);
    }
  };

  const handleCancel = () => {
    if (isTutorial) return;
    showConfirm('Cancelar esta partida? Ela ainda ficará visível por 24h.', () => {
      closeConfirm();
      run(async () => {
        const updated = await api.cancelLobby(id);
        setLobby(updated);
      });
    }, 'Cancelar partida');
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
  const isAdm = isTutorial || (user && lobby.adm_user_id && user.id === lobby.adm_user_id);
  const isInPlayers = players.some(p => p.nick === user?.nick);
  const isInWaitlist = waitlist.some(p => p.nick === user?.nick);
  const isParticipant = isInPlayers || isInWaitlist;
  const hasOpenSlot = players.length < maxPlayers;

  return (
    <div className="min-h-screen bg-valorant-dark pb-8">
      <ConfirmDialog
        open={confirmDialog.open}
        message={confirmDialog.message}
        confirmLabel={confirmDialog.confirmLabel}
        onConfirm={confirmDialog.onConfirm}
        onCancel={closeConfirm}
      />

      {/* Error banner */}
      {errorMsg && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[90] bg-red-900 border border-red-700 text-red-200 text-sm font-medium px-4 py-3 rounded-xl shadow-xl max-w-sm w-full mx-4">
          {errorMsg}
        </div>
      )}

      {/* Banner do mapa */}
      <div id="tutorial-match-banner" className="relative h-36 w-full">
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
            id="tutorial-match-share"
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
        <div id="tutorial-match-adm-controls" className="mx-4 mt-4 flex flex-col gap-2">
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

      {/* Código personalizado da partida — ADM pode definir; jogadores titulares veem quando IN_GAME */}
      {isAdm && !inactive && (
        <div id="tutorial-match-custom-code" className="mx-4 mt-4 bg-valorant-card border border-valorant-border rounded-xl p-4 flex flex-col gap-3">
          <p className="text-gray-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
            <Key size={12} /> Código da Partida Personalizada
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Ex: ABCD-1234"
              value={customCodeInput}
              onChange={e => setCustomCodeInput(e.target.value)}
              className="flex-1 bg-valorant-dark border border-valorant-border text-white px-3 py-2 rounded-lg text-sm placeholder-gray-600"
            />
            <button
              onClick={handleSaveCustomCode}
              disabled={savingCode || !customCodeInput.trim()}
              className="px-4 py-2 bg-valorant-red hover:bg-red-700 disabled:opacity-50 text-white text-sm font-bold rounded-lg transition-colors"
            >
              {savingCode ? '...' : 'Salvar'}
            </button>
          </div>
          {customCode && (
            <div className="flex items-center justify-between bg-valorant-dark rounded-lg px-3 py-2">
              <span className="text-gray-400 text-xs">Código atual:</span>
              <span className="text-white font-mono font-bold text-sm tracking-widest">{customCode}</span>
            </div>
          )}
          {!customCode && status === 'IN_GAME' && (
            <p className="text-gray-600 text-xs">Nenhum código definido. Os jogadores não conseguirão ver o código.</p>
          )}
          {status === 'WAITING' && (
            <p className="text-gray-600 text-xs">O código será revelado aos titulares quando a partida for iniciada.</p>
          )}
        </div>
      )}

      {/* Exibir código para jogadores titulares (não-ADM) quando IN_GAME */}
      {!isAdm && isInPlayers && status === 'IN_GAME' && (
        <div className="mx-4 mt-4 bg-valorant-card border border-yellow-800 rounded-xl p-4 flex flex-col gap-2">
          <p className="text-yellow-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
            <Key size={12} /> Código da Partida Personalizada
          </p>
          {customCode ? (
            <div className="flex items-center justify-between">
              <span
                className={`font-mono font-bold text-lg tracking-widest ${codeVisible ? 'text-white' : 'text-transparent bg-clip-text select-none blur-sm pointer-events-none'}`}
              >
                {customCode}
              </span>
              <button
                onClick={() => setCodeVisible(v => !v)}
                className="text-gray-400 hover:text-white ml-3 flex-shrink-0"
                title={codeVisible ? 'Ocultar código' : 'Revelar código'}
              >
                {codeVisible ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          ) : (
            <p className="text-gray-500 text-sm">Aguardando o ADM definir o código...</p>
          )}
        </div>
      )}

      {/* Controles de posição — todos os participantes (inclusive ADM) */}
      {(isParticipant || isAdm) && !inactive && (
        <div className="mx-4 mt-4 flex flex-col gap-2">
          {/* ADM observador pode entrar como jogador */}
          {isAdm && !isParticipant && hasOpenSlot && (
            <button
              onClick={handleJoin}
              disabled={joining}
              className="w-full flex items-center justify-center gap-2 bg-blue-800 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl text-sm transition-colors disabled:opacity-50"
            >
              ↑ Entrar como Titular
            </button>
          )}
          {isAdm && !isParticipant && !hasOpenSlot && waitlist.length < waitlistLimit && (
            <button
              onClick={handleJoin}
              disabled={joining}
              className="w-full flex items-center justify-center gap-2 border border-blue-700 hover:bg-blue-900/30 text-blue-400 font-bold py-2.5 rounded-xl text-sm transition-colors disabled:opacity-50"
            >
              + Entrar na Fila de Espera
            </button>
          )}
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
      <div id="tutorial-match-players" className="px-4 py-4">
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

      {/* Chat da sala */}
      {user && (
        <div id="tutorial-match-chat">
          <ChatBox
            sendMessage={sendMessage}
            messages={chatMessages}
            currentNick={user.nick}
          />
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

