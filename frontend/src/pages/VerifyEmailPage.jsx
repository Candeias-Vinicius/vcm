import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Loader } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [status, setStatus] = useState('loading'); // 'loading' | 'success' | 'error'
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    const email = searchParams.get('email');

    if (!token || !email) {
      setStatus('error');
      setMessage('Link inválido. Token ou e-mail ausente.');
      return;
    }

    api.verifyEmail(email, token)
      .then(async () => {
        await refreshUser();
        setStatus('success');
        setMessage('E-mail verificado com sucesso!');
        setTimeout(() => navigate('/'), 2500);
      })
      .catch(err => {
        setStatus('error');
        setMessage(err.message || 'Link inválido ou expirado.');
      });
  }, []);

  return (
    <div className="min-h-screen bg-valorant-dark flex items-center justify-center px-4">
      <div className="bg-valorant-card border border-valorant-border rounded-2xl p-8 max-w-sm w-full flex flex-col items-center gap-5 shadow-2xl text-center">
        <h1 className="text-valorant-red font-bold text-2xl uppercase tracking-widest">VCM</h1>

        {status === 'loading' && (
          <>
            <Loader size={40} className="text-valorant-red animate-spin" />
            <p className="text-gray-300 text-sm">Verificando seu e-mail...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle size={40} className="text-green-400" />
            <div>
              <p className="text-white font-bold text-base">{message}</p>
              <p className="text-gray-400 text-sm mt-1">Redirecionando para o lobby...</p>
            </div>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle size={40} className="text-red-400" />
            <div>
              <p className="text-white font-bold text-base">Verificação falhou</p>
              <p className="text-gray-400 text-sm mt-1">{message}</p>
            </div>
            <button
              onClick={() => navigate('/')}
              className="mt-2 bg-valorant-red hover:bg-red-600 text-white font-bold px-6 py-2.5 rounded-lg text-sm transition-colors"
            >
              Ir para o início
            </button>
          </>
        )}
      </div>
    </div>
  );
}
