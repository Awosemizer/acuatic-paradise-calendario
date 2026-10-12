import {
  addDays,
  addMonths,
  addWeeks,
  eachDayOfInterval,
  endOfDay,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subDays,
  subMonths,
  subWeeks,
} from 'date-fns';
import { es } from 'date-fns/locale';
import type { CalendarView } from '@/src/types';
import { getSettings } from '@/src/lib/settingsStore';

function wso() {
  return getSettings().weekStartsOn;
}

const locale = { locale: es };

export function formatDayHeading(date: Date) {
  return format(date, "EEEE d 'de' MMMM", locale);
}

export function formatShortDay(date: Date) {
  return format(date, 'EEE d', locale);
}

export function formatMonthYear(date: Date) {
  const raw = format(date, 'LLLL yyyy', locale);
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

/** 12-hour clock, e.g. "3:05 p.m." */
export function formatTime(date: Date | string) {
  const d = typeof date === 'string' ? parseISO(date) : date;
  const h = d.getHours();
  const h12 = h % 12 === 0 ? 12 : h % 12;
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h12}:${m} ${h < 12 ? 'a.m.' : 'p.m.'}`;
}

/** "HH:mm" string -> "3:05 p.m." */
export function formatTimeString(value: string) {
  const [hh, mm] = value.split(':').map(Number);
  const d = new Date();
  d.setHours(hh || 0, mm || 0, 0, 0);
  return formatTime(d);
}

export function formatDateLong(date: Date | string) {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, "EEE d 'de' MMM yyyy", locale);
}

export function formatDateTimeShort(date: Date | string) {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return `${format(d, 'd MMM yyyy', locale)} · ${formatTime(d)}`;
}

export function formatRange(start: Date | string, durationMinutes: number) {
  const d = typeof start === 'string' ? parseISO(start) : start;
  const end = new Date(d.getTime() + durationMinutes * 60_000);
  return `${formatTime(d)} – ${formatTime(end)}`;
}

export function formatChipDate(date: Date | string) {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return `${format(d, 'd MMM', locale)} · ${formatTime(d)}`;
}

export function weekdayLetter(date: Date) {
  return format(date, 'EEEEE', locale).toUpperCase();
}

export function rangeForView(cursor: Date, view: CalendarView) {
  if (view === 'day') {
    return { start: startOfDay(cursor), end: endOfDay(cursor) };
  }
  if (view === 'week') {
    const start = startOfWeek(cursor, { weekStartsOn: wso() });
    const end = endOfWeek(cursor, { weekStartsOn: wso() });
    return { start, end };
  }
  const monthStart = startOfMonth(cursor);
  const monthEnd = endOfMonth(cursor);
  return {
    start: startOfWeek(monthStart, { weekStartsOn: wso() }),
    end: endOfWeek(monthEnd, { weekStartsOn: wso() }),
  };
}

export function shiftCursor(cursor: Date, view: CalendarView, direction: -1 | 1) {
  if (view === 'day') return direction === 1 ? addDays(cursor, 1) : subDays(cursor, 1);
  if (view === 'week') return direction === 1 ? addWeeks(cursor, 1) : subWeeks(cursor, 1);
  return direction === 1 ? addMonths(cursor, 1) : subMonths(cursor, 1);
}

export function weekDays(cursor: Date) {
  const start = startOfWeek(cursor, { weekStartsOn: wso() });
  return eachDayOfInterval({ start, end: addDays(start, 6) });
}

export function monthGrid(cursor: Date) {
  const start = startOfWeek(startOfMonth(cursor), { weekStartsOn: wso() });
  const end = endOfWeek(endOfMonth(cursor), { weekStartsOn: wso() });
  return eachDayOfInterval({ start, end });
}

export function combineDateAndTime(date: Date, hours: number, minutes: number) {
  const next = new Date(date);
  next.setHours(hours, minutes, 0, 0);
  return next;
}

export function toDateInput(date: Date) {
  return format(date, 'yyyy-MM-dd');
}

export function toTimeInput(date: Date) {
  return format(date, 'HH:mm');
}

export function parseDateTimeInputs(dateStr: string, timeStr: string) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const [hh, mm] = timeStr.split(':').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1, hh ?? 10, mm ?? 0, 0, 0);
}

export { isSameDay, isSameMonth, parseISO, startOfDay };
