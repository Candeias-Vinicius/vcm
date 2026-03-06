import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Clock, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

function SectionCard({ title, children }) {
  return (
    <div className="bg-valorant-card border border-valorant-border rounded-2xl p-6 flex flex-col gap-4">
      <h2 className="text-white font-bold text-base uppercase tracking-wider">{title}</h2>
      {children}
    </div>
  );
}

function StatusBadge({ verified }) {
  if (verified === true) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-green-400 font-semibold bg-green-400/10 border border-green-400/30 px-2 py-0.5 rounded-full">
        <CheckCircle size={11} /> Verificado
      </span>
    );
  }
  if (verified === false) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-yellow-400 font-semibold bg-yellow-400/10 border border-yellow-400/30 px-2 py-0.5 rounded-full">
        <Clock size={11} /> Não verificado
      </span>
    );
  }
  return null;
}

function LockedNotice() {
  return (
    <p className="flex items-center gap-1.5 text-xs text-yellow-400/80">
      <AlertCircle size={13} />
      Verifique seu e-mail para desbloquear esta opção.
    </p>
  );
}

function Feedback({ msg, error }) {
  if (!msg) return null;
  return (
    <p className={`text-xs font-medium ${error ? 'text-red-400' : 'text-green-400'}`}>{msg}</p>
  );
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();

  const verified = user?.email_verified === true;

  // Nickname section
  const [newNick, setNewNick] = useState('');
  const [nickMsg, setNickMsg] = useState({ text: '', error: false });
  const [nickLoading, setNickLoading] = useState(false);

  // Password section
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [showCurrentPwd, setShowCurrentPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [pwdMsg, setPwdMsg] = useState({ text: '', error: false });
  const [pwdLoading, setPwdLoading] = useState(false);

  // Email section
  const [newEmail, setNewEmail] = useState('');
  const [emailMsg, setEmailMsg] = useState({ text: '', error: false });
  const [emailLoading, setEmailLoading] = useState(false);

  async function handleUpdateNick(e) {
    e.preventDefault();
    if (!newNick.trim()) return;
    setNickLoading(true);
    setNickMsg({ text: '', error: false });
    try {
      await api.updateNick(newNick.trim());
      await refreshUser();
      setNewNick('');
      setNickMsg({ text: 'Nickname atualizado com sucesso!', error: false });
    } catch (err) {
      setNickMsg({ text: err.message, error: true });
    } finally {
      setNickLoading(false);
    }
  }

  async function handleUpdatePassword(e) {
    e.preventDefault();
    if (newPwd !== confirmPwd) {
      setPwdMsg({ text: 'As senhas não coincidem.', error: true });
      return;
    }
    setPwdLoading(true);
    setPwdMsg({ text: '', error: false });
    try {
      await api.updatePassword(currentPwd, newPwd);
      setCurrentPwd('');
      setNewPwd('');
      setConfirmPwd('');
      setPwdMsg({ text: 'Senha atualizada com sucesso!', error: false });
    } catch (err) {
      setPwdMsg({ text: err.message, error: true });
    } finally {
      setPwdLoading(false);
    }
  }

  async function handleRequestEmailChange(e) {
    e.preventDefault();
    if (!newEmail.trim()) return;
    setEmailLoading(true);
    setEmailMsg({ text: '', error: false });
    try {
      await api.requestEmailChange(newEmail.trim());
      setNewEmail('');
      setEmailMsg({ text: 'E-mail de confirmação enviado para o novo endereço!', error: false });
    } catch (err) {
      setEmailMsg({ text: err.message, error: true });
    } finally {
      setEmailLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-valorant-dark">
      {/* Header */}
      <div className="bg-valorant-card border-b border-valorant-border px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <button
          onClick={() => navigate('/')}
          className="text-gray-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-valorant-border"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-white font-bold text-lg">Meu Perfil</h1>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 flex flex-col gap-5">

        {/* Nickname */}
        <SectionCard title="Nickname">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <span>Atual:</span>
            <span className="text-white font-bold">{user?.nick}</span>
          </div>
          {verified ? (
            <form onSubmit={handleUpdateNick} className="flex flex-col gap-3">
              <input
                type="text"
                value={newNick}
                onChange={e => setNewNick(e.target.value)}
                placeholder="Novo nickname (2–20 caracteres)"
                minLength={2}
                maxLength={20}
                className="bg-valorant-dark border border-valorant-border rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-valorant-red transition-colors"
              />
              <Feedback msg={nickMsg.text} error={nickMsg.error} />
              <button
                type="submit"
                disabled={nickLoading || !newNick.trim()}
                className="bg-valorant-red hover:bg-red-600 disabled:opacity-50 text-white font-bold text-sm px-4 py-2.5 rounded-lg transition-colors"
              >
                {nickLoading ? 'Salvando...' : 'Salvar nickname'}
              </button>
            </form>
          ) : (
            <LockedNotice />
          )}
        </SectionCard>

        {/* Email */}
        <SectionCard title="E-mail">
          <div className="flex flex-wrap items-center gap-2 text-sm text-gray-400">
            <span>Atual:</span>
            <span className="text-white font-bold">{user?.email}</span>
            <StatusBadge verified={user?.email_verified} />
          </div>

          {user?.pending_email && (
            <div className="flex items-start gap-2 bg-yellow-400/5 border border-yellow-400/20 rounded-lg px-3 py-2.5 text-xs text-yellow-300">
              <Clock size={13} className="mt-0.5 shrink-0" />
              <span>
                Aguardando confirmação para{' '}
                <strong className="text-yellow-200">{user.pending_email}</strong>.
                Verifique a caixa de entrada desse endereço.
              </span>
            </div>
          )}

          {verified ? (
            <form onSubmit={handleRequestEmailChange} className="flex flex-col gap-3">
              <input
                type="email"
                value={newEmail}
                onChange={e => setNewEmail(e.target.value)}
                placeholder="Novo e-mail"
                className="bg-valorant-dark border border-valorant-border rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-valorant-red transition-colors"
              />
              <p className="text-xs text-gray-500">
                Um link de confirmação será enviado ao novo endereço. O e-mail atual permanece ativo até a confirmação.
              </p>
              <Feedback msg={emailMsg.text} error={emailMsg.error} />
              <button
                type="submit"
                disabled={emailLoading || !newEmail.trim()}
                className="bg-valorant-red hover:bg-red-600 disabled:opacity-50 text-white font-bold text-sm px-4 py-2.5 rounded-lg transition-colors"
              >
                {emailLoading ? 'Enviando...' : 'Solicitar troca de e-mail'}
              </button>
            </form>
          ) : (
            <LockedNotice />
          )}
        </SectionCard>

        {/* Password */}
        <SectionCard title="Senha">
          {verified ? (
            <form onSubmit={handleUpdatePassword} className="flex flex-col gap-3">
              {/* Current password */}
              <div className="relative">
                <input
                  type={showCurrentPwd ? 'text' : 'password'}
                  value={currentPwd}
                  onChange={e => setCurrentPwd(e.target.value)}
                  placeholder="Senha atual"
                  className="w-full bg-valorant-dark border border-valorant-border rounded-lg px-3 py-2.5 pr-10 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-valorant-red transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPwd(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                >
                  {showCurrentPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>

              {/* New password */}
              <div className="relative">
                <input
                  type={showNewPwd ? 'text' : 'password'}
                  value={newPwd}
                  onChange={e => setNewPwd(e.target.value)}
                  placeholder="Nova senha (mín. 6 caracteres)"
                  minLength={6}
                  className="w-full bg-valorant-dark border border-valorant-border rounded-lg px-3 py-2.5 pr-10 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-valorant-red transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPwd(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                >
                  {showNewPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>

              <input
                type="password"
                value={confirmPwd}
                onChange={e => setConfirmPwd(e.target.value)}
                placeholder="Confirmar nova senha"
                className="bg-valorant-dark border border-valorant-border rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-valorant-red transition-colors"
              />

              <Feedback msg={pwdMsg.text} error={pwdMsg.error} />

              <button
                type="submit"
                disabled={pwdLoading || !currentPwd || !newPwd || !confirmPwd}
                className="bg-valorant-red hover:bg-red-600 disabled:opacity-50 text-white font-bold text-sm px-4 py-2.5 rounded-lg transition-colors"
              >
                {pwdLoading ? 'Salvando...' : 'Atualizar senha'}
              </button>
            </form>
          ) : (
            <LockedNotice />
          )}
        </SectionCard>

      </div>
    </div>
  );
}
