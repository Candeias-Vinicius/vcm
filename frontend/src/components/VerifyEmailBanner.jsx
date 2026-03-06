import { useState } from 'react';
import { MailCheck, X } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function VerifyEmailBanner() {
  const { user } = useAuth();
  const [dismissed, setDismissed] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  // Only show for new users who explicitly have email_verified === false
  if (!user || user.email_verified !== false || dismissed) return null;

  async function handleResend() {
    setSending(true);
    setError('');
    try {
      await api.resendVerification();
      setSent(true);
    } catch (err) {
      setError(err.message || 'Erro ao reenviar. Tente novamente.');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="bg-valorant-card border-b border-yellow-500/40 text-yellow-200 px-4 py-2.5 flex items-center gap-3 text-sm">
      <MailCheck size={16} className="text-yellow-400 shrink-0" />
      <span className="flex-1 min-w-0">
        {sent
          ? 'E-mail de verificação enviado! Verifique sua caixa de entrada.'
          : 'Confirme seu e-mail para garantir o acesso à recuperação de conta.'}
      </span>
      {error && <span className="text-red-400 text-xs shrink-0">{error}</span>}
      {!sent && (
        <button
          onClick={handleResend}
          disabled={sending}
          className="shrink-0 bg-yellow-500/20 hover:bg-yellow-500/40 border border-yellow-500/50 text-yellow-200 text-xs font-semibold px-3 py-1 rounded-lg transition-colors disabled:opacity-50"
        >
          {sending ? 'Enviando...' : 'Reenviar e-mail'}
        </button>
      )}
      <button
        onClick={() => setDismissed(true)}
        className="shrink-0 text-yellow-400/60 hover:text-yellow-400 transition-colors"
        aria-label="Fechar"
      >
        <X size={14} />
      </button>
    </div>
  );
}
