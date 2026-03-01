import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Crosshair, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { api } from '../services/api';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';
  const email = searchParams.get('email') || '';

  const [form, setForm] = useState({ newPassword: '', confirm: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (form.newPassword !== form.confirm) {
      setError('As senhas não coincidem');
      return;
    }
    if (form.newPassword.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await api.resetPassword(email, token, form.newPassword);
      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (!token || !email) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-valorant-dark px-4 gap-4">
        <p className="text-red-400">Link inválido ou expirado.</p>
        <Link to="/forgot-password" className="text-valorant-red hover:underline text-sm">
          Solicitar novo link
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-valorant-dark px-4">
      <div className="mb-8 flex flex-col items-center gap-2">
        <Crosshair size={48} className="text-valorant-red" />
        <h1 className="text-3xl font-bold tracking-widest uppercase text-white">VCM</h1>
      </div>

      <div className="w-full max-w-sm">
        {success ? (
          <div className="flex flex-col items-center gap-4 text-center">
            <CheckCircle size={48} className="text-green-400" />
            <h2 className="text-white font-bold text-lg">Senha atualizada!</h2>
            <p className="text-gray-400 text-sm">Sua senha foi redefinida com sucesso.</p>
            <button
              onClick={() => navigate('/login', { replace: true })}
              className="bg-valorant-red text-white font-bold px-6 py-2 rounded-lg"
            >
              Fazer Login
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <h2 className="text-white font-bold text-lg text-center mb-1">Nova senha</h2>

            {error && (
              <div className="bg-red-900/50 border border-red-700 rounded-lg px-4 py-2 text-red-300 text-sm text-center">
                {error}
              </div>
            )}

            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                placeholder="Nova senha (mín. 6 caracteres)"
                value={form.newPassword}
                onChange={e => { setForm(f => ({ ...f, newPassword: e.target.value })); setError(''); }}
                required
                minLength={6}
                className="w-full bg-valorant-card border border-valorant-border rounded-lg px-4 py-3 pr-11 text-white placeholder-gray-500 focus:outline-none focus:border-valorant-red"
              />
              <button
                type="button"
                onClick={() => setShowPass(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
              >
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <input
              type={showPass ? 'text' : 'password'}
              placeholder="Confirmar nova senha"
              value={form.confirm}
              onChange={e => { setForm(f => ({ ...f, confirm: e.target.value })); setError(''); }}
              required
              className="bg-valorant-card border border-valorant-border rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-valorant-red"
            />

            <button
              type="submit"
              disabled={loading}
              className="bg-valorant-red hover:bg-red-500 disabled:opacity-60 transition-colors text-white font-bold py-3 rounded-lg uppercase tracking-wider mt-1"
            >
              {loading ? 'Salvando...' : 'Salvar Nova Senha'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
