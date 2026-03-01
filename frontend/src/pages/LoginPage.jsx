import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Crosshair, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/';
  const [form, setForm] = useState({ login: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function update(key, value) {
    setForm(f => ({ ...f, [key]: value }));
    setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(form.login, form.password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-valorant-dark px-4">
      <div className="mb-8 flex flex-col items-center gap-2">
        <Crosshair size={48} className="text-valorant-red" />
        <h1 className="text-3xl font-bold tracking-widest uppercase text-white">VCM</h1>
        <p className="text-gray-400 text-sm">Valorant Custom Manager</p>
      </div>

      <form onSubmit={handleSubmit} className="w-full max-w-sm flex flex-col gap-3">
        <h2 className="text-white font-bold text-lg text-center mb-1">Entrar na sua conta</h2>

        {error && (
          <div className="bg-red-900/50 border border-red-700 rounded-lg px-4 py-2 text-red-300 text-sm text-center">
            {error}
          </div>
        )}

        <input
          type="text"
          placeholder="E-mail ou Nickname"
          value={form.login}
          onChange={e => update('login', e.target.value)}
          required
          autoComplete="username"
          className="bg-valorant-card border border-valorant-border rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-valorant-red"
        />

        <div className="relative">
          <input
            type={showPass ? 'text' : 'password'}
            placeholder="Senha"
            value={form.password}
            onChange={e => update('password', e.target.value)}
            required
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

        <div className="text-right">
          <Link to="/forgot-password" className="text-valorant-red text-xs hover:underline">
            Esqueci minha senha
          </Link>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-valorant-red hover:bg-red-500 disabled:opacity-60 transition-colors text-white font-bold py-3 rounded-lg uppercase tracking-wider mt-1"
        >
          {loading ? 'Entrando...' : 'Entrar'}
        </button>

        <p className="text-gray-500 text-sm text-center mt-2">
          Não tem conta?{' '}
          <Link to="/register" state={{ from }} className="text-valorant-red hover:underline font-semibold">
            Criar conta
          </Link>
        </p>
      </form>
    </div>
  );
}
