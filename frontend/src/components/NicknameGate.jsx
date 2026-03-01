import { useState } from 'react';
import { getNickname, setNickname } from '../hooks/useIdentity';
import { Crosshair } from 'lucide-react';

export default function NicknameGate({ children }) {
  const [nick, setNick] = useState(getNickname());
  const [input, setInput] = useState('');

  if (nick) return children;

  function handleSubmit(e) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;
    setNickname(trimmed);
    setNick(trimmed);
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-valorant-dark px-4">
      <div className="mb-8 flex flex-col items-center gap-2">
        <Crosshair size={48} className="text-valorant-red" />
        <h1 className="text-3xl font-bold tracking-widest uppercase text-white">VCM</h1>
        <p className="text-gray-400 text-sm">Valorant Custom Manager</p>
      </div>

      <form onSubmit={handleSubmit} className="w-full max-w-sm flex flex-col gap-4">
        <input
          type="text"
          placeholder="Digite seu Nickname"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          maxLength={20}
          className="bg-valorant-card border border-valorant-border rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-valorant-red text-center text-lg"
          autoFocus
        />
        <button
          type="submit"
          className="bg-valorant-red hover:bg-red-500 transition-colors text-white font-bold py-3 rounded-lg uppercase tracking-wider"
        >
          Entrar
        </button>
      </form>
    </div>
  );
}
