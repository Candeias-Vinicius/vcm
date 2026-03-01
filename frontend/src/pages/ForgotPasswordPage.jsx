import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Crosshair, CheckCircle } from 'lucide-react';
import { api } from '../services/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.forgotPassword(email);
      setSent(true);
    } catch {
      setError('Erro ao processar solicitação. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-valorant-dark px-4">
      <div className="mb-8 flex flex-col items-center gap-2">
        <Crosshair size={48} className="text-valorant-red" />
        <h1 className="text-3xl font-bold tracking-widest uppercase text-white">VCM</h1>
      </div>

      <div className="w-full max-w-sm">
        {sent ? (
          <div className="flex flex-col items-center gap-4 text-center">
            <CheckCircle size={48} className="text-green-400" />
            <h2 className="text-white font-bold text-lg">Verifique seu e-mail</h2>
            <p className="text-gray-400 text-sm">
              Se o e-mail <strong className="text-white">{email}</strong> estiver cadastrado,
              você receberá um link de redefinição em breve.
            </p>
            <Link to="/login" className="text-valorant-red hover:underline text-sm font-semibold">
              Voltar para o login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <h2 className="text-white font-bold text-lg text-center mb-1">Esqueci minha senha</h2>
            <p className="text-gray-400 text-sm text-center mb-2">
              Digite seu e-mail e enviaremos um link para redefinir sua senha.
            </p>

            {error && (
              <div className="bg-red-900/50 border border-red-700 rounded-lg px-4 py-2 text-red-300 text-sm text-center">
                {error}
              </div>
            )}

            <input
              type="email"
              placeholder="E-mail cadastrado"
              value={email}
              onChange={e => { setEmail(e.target.value); setError(''); }}
              required
              className="bg-valorant-card border border-valorant-border rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-valorant-red"
            />

            <button
              type="submit"
              disabled={loading}
              className="bg-valorant-red hover:bg-red-500 disabled:opacity-60 transition-colors text-white font-bold py-3 rounded-lg uppercase tracking-wider"
            >
              {loading ? 'Enviando...' : 'Enviar Link'}
            </button>

            <Link to="/login" className="text-gray-500 text-sm text-center hover:text-gray-300">
              ← Voltar para o login
            </Link>
          </form>
        )}
      </div>
    </div>
  );
}
