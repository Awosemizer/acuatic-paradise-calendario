import { useCallback, useEffect, useMemo, useState } from 'react';
import { rangeForView } from '@/src/lib/dates';
import { supabase } from '@/src/lib/supabase';
import type { CalendarEvent, CalendarItem, CalendarView, Visit } from '@/src/types';

export function useCalendarData(cursor: Date, view: CalendarView) {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { start, end } = useMemo(() => rangeForView(cursor, view), [cursor, view]);

  const load = useCallback(async () => {
    setError(null);
    const from = start.toISOString();
    const to = end.toISOString();

    const [visitRes, eventRes] = await Promise.all([
      supabase
        .from('visits')
        .select('*')
        .gte('starts_at', from)
        .lte('starts_at', to)
        .order('starts_at', { ascending: true }),
      supabase
        .from('events')
        .select('*')
        .gte('starts_at', from)
        .lte('starts_at', to)
        .order('starts_at', { ascending: true }),
    ]);

    if (visitRes.error || eventRes.error) {
      setError(visitRes.error?.message ?? eventRes.error?.message ?? 'Error al cargar');
    } else {
      setVisits((visitRes.data as Visit[]) ?? []);
      setEvents((eventRes.data as CalendarEvent[]) ?? []);
    }
    setLoading(false);
  }, [start, end]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  useEffect(() => {
    const channel = supabase
      .channel('calendario-salon')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'visits' }, () => {
        load();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, () => {
        load();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [load]);

  const items = useMemo<CalendarItem[]>(() => {
    const combined: CalendarItem[] = [
      ...visits.map((data) => ({ kind: 'visit' as const, data })),
      ...events.map((data) => ({ kind: 'event' as const, data })),
    ];
    return combined.sort(
      (a, b) => new Date(a.data.starts_at).getTime() - new Date(b.data.starts_at).getTime(),
    );
  }, [visits, events]);

  return { visits, events, items, loading, error, refresh: load, rangeStart: start, rangeEnd: end };
}
