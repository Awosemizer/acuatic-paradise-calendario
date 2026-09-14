import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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

  const loadRef = useRef(load);
  useEffect(() => {
    loadRef.current = load;
  }, [load]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  // Subscribe once on mount. Never put `load` in deps — that recreated the
  // channel and tried to add postgres_changes callbacks after subscribe().
  useEffect(() => {
    const topic = `calendario-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    try {
      channel = supabase
        .channel(topic)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'visits' }, () => {
          void loadRef.current();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, () => {
          void loadRef.current();
        });

      channel.subscribe();
    } catch (err) {
      console.warn('Realtime calendario no disponible', err);
    }

    return () => {
      if (channel) {
        void supabase.removeChannel(channel);
      }
    };
  }, []);

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
