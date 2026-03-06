import { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send } from 'lucide-react';

export default function ChatBox({ sendMessage, messages, currentNick }) {
  const [input, setInput] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function handleSend() {
    const trimmed = input.trim();
    if (!trimmed) return;
    sendMessage(trimmed);
    setInput('');
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function formatTime(ts) {
    return new Date(ts).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  return (
    <div className="mx-4 mt-4 bg-valorant-card border border-valorant-border rounded-xl flex flex-col overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-valorant-border">
        <MessageSquare size={14} className="text-gray-400" />
        <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">Chat da Sala</span>
      </div>

      {/* Messages list */}
      <div className="flex flex-col gap-1 px-3 py-2 h-52 overflow-y-auto">
        {messages.length === 0 ? (
          <p className="text-gray-600 text-xs text-center mt-auto mb-auto">
            Nenhuma mensagem ainda. Diga olá!
          </p>
        ) : (
          messages.map((msg, i) => {
            const isOwn = msg.nick === currentNick;
            return (
              <div key={i} className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
                <div
                  className={`max-w-[80%] px-3 py-1.5 rounded-xl text-sm break-words ${
                    isOwn
                      ? 'bg-valorant-red/80 text-white rounded-br-none'
                      : 'bg-valorant-dark text-gray-200 rounded-bl-none'
                  }`}
                >
                  {!isOwn && (
                    <span className="block text-xs font-bold text-valorant-red mb-0.5">{msg.nick}</span>
                  )}
                  {msg.text}
                </div>
                <span className="text-gray-600 text-[10px] mt-0.5 px-1">{formatTime(msg.ts)}</span>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex items-center gap-2 px-3 py-2 border-t border-valorant-border">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Digite uma mensagem..."
          maxLength={300}
          className="flex-1 bg-valorant-dark border border-valorant-border text-white text-sm px-3 py-1.5 rounded-lg placeholder-gray-600 focus:outline-none focus:border-gray-500"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim()}
          className="text-valorant-red hover:text-red-400 disabled:text-gray-700 transition-colors"
          title="Enviar"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}
