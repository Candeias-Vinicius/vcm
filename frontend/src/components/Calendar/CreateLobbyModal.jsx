import { useState } from 'react';
import { X } from 'lucide-react';
import DateTimePicker from './DateTimePicker';

function nextFullHour() {
  const now = new Date();
  now.setMinutes(0, 0, 0);
  now.setHours(now.getHours() + 1);
  return now.toISOString();
}

export default function CreateLobbyModal({ maps, onClose, onCreate, isTutorial, errorMsg }) {
  const [form, setForm] = useState({
    mapa: maps[0],
    data_hora: nextFullHour(),
    adm_is_player: true,
    max_players: 10,
    waitlist_limit: 20,
  });
  const [validationError, setValidationError] = useState('');

  function update(key, value) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.data_hora) { setValidationError('Selecione a data e hora'); return; }
    setValidationError('');
    onCreate(form);
  }

  const displayError = validationError || errorMsg;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-end justify-center z-50">
      <div className="bg-valorant-card border-t border-valorant-border rounded-t-2xl w-full max-w-lg p-5 flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-white font-bold text-lg uppercase tracking-wider">Nova Partida</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={22} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div id="tutorial-modal-mapa">
            <label className="text-gray-400 text-sm mb-1 block">Mapa</label>
            <select
              value={form.mapa}
              onChange={e => update('mapa', e.target.value)}
              className="w-full bg-valorant-dark border border-valorant-border text-white px-3 py-2 rounded-lg"
            >
              {maps.map(m => <option key={m}>{m}</option>)}
            </select>
          </div>

          <div id="tutorial-modal-datahora">
            <label className="text-gray-400 text-sm mb-2 block">Data e Hora</label>
            <DateTimePicker
              value={form.data_hora}
              onChange={v => update('data_hora', v)}
            />
          </div>

          <div id="tutorial-modal-maxplayers">
            <label className="text-gray-400 text-sm mb-1 block">Vagas (máx. jogadores, 2–10)</label>
            <input
              type="number"
              min={2}
              max={10}
              value={form.max_players}
              onChange={e => update('max_players', Number(e.target.value))}
              className="w-full bg-valorant-dark border border-valorant-border text-white px-3 py-2 rounded-lg"
            />
          </div>

          <div id="tutorial-modal-waitlist">
            <label className="text-gray-400 text-sm mb-1 block">Limite da lista de espera</label>
            <input
              type="number"
              min={1}
              max={50}
              value={form.waitlist_limit}
              onChange={e => update('waitlist_limit', Number(e.target.value))}
              className="w-full bg-valorant-dark border border-valorant-border text-white px-3 py-2 rounded-lg"
            />
          </div>

          <div id="tutorial-modal-admplayer" className="flex items-center gap-3">
            <input
              type="checkbox"
              id="adm_player"
              checked={form.adm_is_player}
              onChange={e => update('adm_is_player', e.target.checked)}
              className="w-4 h-4 accent-valorant-red"
            />
            <label htmlFor="adm_player" className="text-gray-300 text-sm">
              Quero jogar como um dos 10 titulares
            </label>
          </div>

          {displayError && (
            <p className="text-red-400 text-sm bg-red-900/30 border border-red-800 rounded-lg px-3 py-2">{displayError}</p>
          )}

          <button
            id="tutorial-modal-submit"
            type="submit"
            className="bg-valorant-red hover:bg-red-500 transition-colors text-white font-bold py-3 rounded-lg uppercase tracking-wider"
          >
            Criar Sala
          </button>
        </form>
      </div>
    </div>
  );
}
