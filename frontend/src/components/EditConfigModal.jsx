import { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';

const MAPS = ['Haven', 'Bind', 'Split', 'Ascent', 'Icebox', 'Breeze', 'Fracture', 'Pearl', 'Lotus', 'Sunset', 'Abyss', 'Corrode'];

export default function EditConfigModal({ isOpen, onClose, config, onSave, busy }) {
  const [form, setForm] = useState({
    mapa: config?.mapa ?? 'Haven',
    max_players: config?.max_players ?? 10,
    waitlist_limit: config?.waitlist_limit ?? 20,
  });

  useEffect(() => {
    if (config) {
      setForm({
        mapa: config.mapa,
        max_players: config.max_players ?? 10,
        waitlist_limit: config.waitlist_limit ?? 20,
      });
    }
  }, [config]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end">
      <div className="w-full max-w-lg mx-auto bg-valorant-card border-t border-valorant-border rounded-t-2xl p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-bold text-base">Editar Sala</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div>
          <label className="text-gray-500 text-xs mb-1 block">Mapa</label>
          <select
            value={form.mapa}
            onChange={e => setForm(f => ({ ...f, mapa: e.target.value }))}
            className="w-full bg-valorant-dark border border-valorant-border text-white px-3 py-2 rounded-lg text-sm"
          >
            {MAPS.map(m => <option key={m}>{m}</option>)}
          </select>
        </div>

        <div>
          <label className="text-gray-500 text-xs mb-1 block">Vagas (máx. jogadores)</label>
          <input
            type="number" min={2} max={10}
            value={form.max_players}
            onChange={e => setForm(f => ({ ...f, max_players: Number(e.target.value) }))}
            className="w-full bg-valorant-dark border border-valorant-border text-white px-3 py-2 rounded-lg text-sm"
          />
        </div>

        <div>
          <label className="text-gray-500 text-xs mb-1 block">Limite da Lista de Espera</label>
          <input
            type="number" min={1} max={50}
            value={form.waitlist_limit}
            onChange={e => setForm(f => ({ ...f, waitlist_limit: Number(e.target.value) }))}
            className="w-full bg-valorant-dark border border-valorant-border text-white px-3 py-2 rounded-lg text-sm"
          />
        </div>

        <button
          onClick={() => onSave(form)}
          disabled={busy}
          className="flex items-center justify-center gap-2 bg-valorant-red text-white font-bold py-3 rounded-xl text-sm disabled:opacity-50"
        >
          <Save size={14} /> Salvar
        </button>
      </div>
    </div>
  );
}
