import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react';

const WEEKDAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

// Próxima hora cheia a partir de agora
function nextFullHour() {
  const now = new Date();
  const next = new Date(now);
  next.setMinutes(0, 0, 0);
  next.setHours(now.getHours() + 1);
  return next;
}

function sameDay(a, b) {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate();
}

// Gera dias do mês com offset de dias anteriores para alinhar na grade
function buildCalendarDays(year, month) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  return cells;
}

export default function DateTimePicker({ value, onChange }) {
  const initial = value ? new Date(value) : nextFullHour();

  const [viewYear, setViewYear] = useState(initial.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial.getMonth());
  const [selectedDate, setSelectedDate] = useState(initial);
  const [hour, setHour] = useState(initial.getHours());
  const [minute, setMinute] = useState(0); // sempre minuto zero (hora cheia)

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const maxDate = new Date(today);
  maxDate.setDate(maxDate.getDate() + 14); // hoje + 14 = 15 dias no total

  const cells = useMemo(() => buildCalendarDays(viewYear, viewMonth), [viewYear, viewMonth]);

  function emit(date, h, m) {
    const d = new Date(date);
    d.setHours(h, m, 0, 0);
    onChange(d.toISOString());
  }

  function selectDay(day) {
    if (!day || day < today) return;
    setSelectedDate(day);
    emit(day, hour, minute);
  }

  function changeHour(h) {
    setHour(h);
    emit(selectedDate, h, minute);
  }

  function prevMonth() {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  }

  function nextMonth() {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  }

  const hours = Array.from({ length: 24 }, (_, i) => i);

  return (
    <div className="bg-valorant-dark border border-valorant-border rounded-xl p-3 select-none">
      {/* Navegação do mês */}
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={prevMonth}
          className="text-gray-400 hover:text-white p-1 rounded"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="text-white text-sm font-semibold">
          {MONTHS[viewMonth]} {viewYear}
        </span>
        <button
          type="button"
          onClick={nextMonth}
          className="text-gray-400 hover:text-white p-1 rounded"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Cabeçalho dias da semana */}
      <div className="grid grid-cols-7 mb-1">
        {WEEKDAYS.map((d, i) => (
          <div key={i} className="text-center text-gray-600 text-xs py-1">{d}</div>
        ))}
      </div>

      {/* Grade de dias */}
      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((day, i) => {
          if (!day) return <div key={i} />;
          const isPast = day < today;
          const isBeyond = day > maxDate;
          const isDisabled = isPast || isBeyond;
          const isSelected = sameDay(day, selectedDate);
          const isToday = sameDay(day, today);

          return (
            <button
              key={i}
              type="button"
              disabled={isDisabled}
              onClick={() => selectDay(day)}
              className={`
                aspect-square flex items-center justify-center rounded-lg text-xs font-medium transition-colors
                ${isDisabled ? 'text-gray-700 cursor-not-allowed' : 'cursor-pointer hover:bg-valorant-border'}
                ${isSelected ? 'bg-valorant-red text-white hover:bg-red-500' : ''}
                ${isToday && !isSelected ? 'text-valorant-red font-bold' : ''}
                ${!isDisabled && !isSelected ? 'text-gray-300' : ''}
              `}
            >
              {day.getDate()}
            </button>
          );
        })}
      </div>

      {/* Seletor de hora */}
      <div className="mt-3 pt-3 border-t border-valorant-border">
        <div className="flex items-center gap-2 mb-2">
          <Clock size={13} className="text-valorant-red" />
          <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Horário</span>
        </div>
        <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
          {hours.map(h => (
            <button
              key={h}
              type="button"
              onClick={() => changeHour(h)}
              className={`
                px-2 py-1 rounded text-xs font-mono font-semibold transition-colors
                ${hour === h
                  ? 'bg-valorant-red text-white'
                  : 'bg-valorant-card text-gray-400 hover:text-white border border-valorant-border'}
              `}
            >
              {String(h).padStart(2, '0')}:00
            </button>
          ))}
        </div>
      </div>

      {/* Preview da seleção */}
      {value && (
        <div className="mt-3 pt-2 border-t border-valorant-border text-center text-xs text-gray-400">
          {new Date(value).toLocaleString('pt-BR', {
            weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
          })}
        </div>
      )}
    </div>
  );
}
