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

export function formatTime(date: Date | string) {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'HH:mm');
}

export function formatRange(start: Date | string, durationMinutes: number) {
  const d = typeof start === 'string' ? parseISO(start) : start;
  const end = new Date(d.getTime() + durationMinutes * 60_000);
  return `${formatTime(d)} – ${formatTime(end)}`;
}

export function formatChipDate(date: Date | string) {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, "d MMM · HH:mm", locale);
}

export function weekdayLetter(date: Date) {
  return format(date, 'EEEEE', locale).toUpperCase();
}

export function rangeForView(cursor: Date, view: CalendarView) {
  if (view === 'day') {
    return { start: startOfDay(cursor), end: endOfDay(cursor) };
  }
  if (view === 'week') {
    const start = startOfWeek(cursor, { weekStartsOn: 1 });
    const end = endOfWeek(cursor, { weekStartsOn: 1 });
    return { start, end };
  }
  const monthStart = startOfMonth(cursor);
  const monthEnd = endOfMonth(cursor);
  return {
    start: startOfWeek(monthStart, { weekStartsOn: 1 }),
    end: endOfWeek(monthEnd, { weekStartsOn: 1 }),
  };
}

export function shiftCursor(cursor: Date, view: CalendarView, direction: -1 | 1) {
  if (view === 'day') return direction === 1 ? addDays(cursor, 1) : subDays(cursor, 1);
  if (view === 'week') return direction === 1 ? addWeeks(cursor, 1) : subWeeks(cursor, 1);
  return direction === 1 ? addMonths(cursor, 1) : subMonths(cursor, 1);
}

export function weekDays(cursor: Date) {
  const start = startOfWeek(cursor, { weekStartsOn: 1 });
  return eachDayOfInterval({ start, end: addDays(start, 6) });
}

export function monthGrid(cursor: Date) {
  const start = startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 });
  const end = endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 });
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
