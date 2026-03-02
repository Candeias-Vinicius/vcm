import { toZonedTime, format } from 'date-fns-tz';

const BRT = 'America/Sao_Paulo';

export function formatDate(date) {
  const zoned = toZonedTime(new Date(date), BRT);
  return format(zoned, 'dd/MM', { timeZone: BRT });
}

export function formatTime(date) {
  const zoned = toZonedTime(new Date(date), BRT);
  return format(zoned, 'HH:mm', { timeZone: BRT });
}

export function formatFull(date) {
  const zoned = toZonedTime(new Date(date), BRT);
  return format(zoned, "EEEE, dd/MM 'às' HH:mm", { timeZone: BRT });
}

export function formatWeekday(date) {
  const zoned = toZonedTime(new Date(date), BRT);
  const w = format(zoned, 'EEEE', { timeZone: BRT });
  return w.charAt(0).toUpperCase() + w.slice(1);
}
