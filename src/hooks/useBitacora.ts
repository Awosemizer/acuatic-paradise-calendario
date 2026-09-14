import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { addDays, differenceInCalendarDays, parseISO } from 'date-fns';
import { supabase } from '@/src/lib/supabase';
import type {
  BitacoraArea,
  BitacoraItem,
  BitacoraLog,
  BitacoraStatus,
} from '@/src/types';

export type BitacoraFilter = 'todas' | BitacoraArea;

export function mapBitacoraError(message: string, code?: string) {
  if (message.includes('does not exist') || code === '42P01') {
    return 'La bitácora aún no está creada. Aplica supabase/migrations/20260914200000_bitacora.sql.';
  }
  return message;
}

export function nextDueAt(item: BitacoraItem): Date | null {
  if (!item.last_done_at) return null;
  return addDays(parseISO(item.last_done_at), item.interval_days);
}

export function bitacoraStatus(item: BitacoraItem, now = new Date()): BitacoraStatus {
  const next = nextDueAt(item);
  if (!next) return 'vencido';
  const remaining = differenceInCalendarDays(next, now);
  if (remaining <= 0) return 'vencido';
  const amberByDays = remaining <= 7;
  const amberByPct = remaining <= Math.ceil(item.interval_days * 0.2);
  if (amberByDays || amberByPct) return 'pronto';
  return 'al_dia';
}

export function statusMeta(status: BitacoraStatus) {
  if (status === 'al_dia') {
    return { label: 'Al día', bg: '#D9F5EA', fg: '#0F7A52' };
  }
  if (status === 'pronto') {
    return { label: 'Pronto', bg: '#FFF3D6', fg: '#9A6700' };
  }
  return { label: 'Vencido', bg: '#FDE8E8', fg: '#B42318' };
}

export function areaLabel(area: BitacoraArea) {
  if (area === 'piscina') return 'Piscina';
  if (area === 'salon') return 'Salón';
  return 'General';
}

type UpsertInput = {
  title: string;
  area: BitacoraArea;
  interval_days: number;
  description?: string | null;
  notes?: string | null;
  active?: boolean;
};

export function useBitacora() {
  const [items, setItems] = useState<BitacoraItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    const { data, error: err } = await supabase
      .from('bitacora_items')
      .select('*')
      .eq('active', true)
      .order('area', { ascending: true })
      .order('title', { ascending: true });
    if (err) {
      setError(mapBitacoraError(err.message, err.code));
      setItems([]);
    } else {
      setItems((data as BitacoraItem[]) ?? []);
    }
    setLoading(false);
  }, []);

  const loadRef = useRef(load);
  useEffect(() => {
    loadRef.current = load;
  }, [load]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const topic = `bitacora-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    let channel: ReturnType<typeof supabase.channel> | null = null;
    try {
      channel = supabase
        .channel(topic)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'bitacora_items' },
          () => {
            void loadRef.current();
          },
        );
      channel.subscribe();
    } catch (err) {
      console.warn('Realtime bitácora no disponible', err);
    }
    return () => {
      if (channel) void supabase.removeChannel(channel);
    };
  }, []);

  const sorted = useMemo(() => {
    const rank: Record<BitacoraStatus, number> = { vencido: 0, pronto: 1, al_dia: 2 };
    return [...items].sort((a, b) => {
      const sa = rank[bitacoraStatus(a)];
      const sb = rank[bitacoraStatus(b)];
      if (sa !== sb) return sa - sb;
      return a.title.localeCompare(b.title, 'es');
    });
  }, [items]);

  async function createItem(input: UpsertInput, userId?: string | null) {
    const { error: err } = await supabase.from('bitacora_items').insert({
      title: input.title.trim(),
      area: input.area,
      interval_days: input.interval_days,
      description: input.description?.trim() || null,
      notes: input.notes?.trim() || null,
      active: input.active ?? true,
      created_by: userId ?? null,
    });
    if (err) throw new Error(mapBitacoraError(err.message, err.code));
    await load();
  }

  async function updateItem(id: string, input: UpsertInput) {
    const { error: err } = await supabase
      .from('bitacora_items')
      .update({
        title: input.title.trim(),
        area: input.area,
        interval_days: input.interval_days,
        description: input.description?.trim() || null,
        notes: input.notes?.trim() || null,
        active: input.active ?? true,
      })
      .eq('id', id);
    if (err) throw new Error(mapBitacoraError(err.message, err.code));
    await load();
  }

  async function registerDone(itemId: string, userId?: string | null, notes?: string) {
    const now = new Date().toISOString();
    const { error: logErr } = await supabase.from('bitacora_logs').insert({
      item_id: itemId,
      done_at: now,
      done_by: userId ?? null,
      notes: notes?.trim() || null,
    });
    if (logErr) throw new Error(mapBitacoraError(logErr.message, logErr.code));

    const { error: itemErr } = await supabase
      .from('bitacora_items')
      .update({ last_done_at: now, notes: notes?.trim() || null })
      .eq('id', itemId);
    if (itemErr) throw new Error(mapBitacoraError(itemErr.message, itemErr.code));
    await load();
  }

  async function fetchLogs(itemId: string): Promise<BitacoraLog[]> {
    const { data, error: err } = await supabase
      .from('bitacora_logs')
      .select('*')
      .eq('item_id', itemId)
      .order('done_at', { ascending: false })
      .limit(40);
    if (err) throw new Error(mapBitacoraError(err.message, err.code));
    return (data as BitacoraLog[]) ?? [];
  }

  return {
    items: sorted,
    loading,
    error,
    reload: load,
    createItem,
    updateItem,
    registerDone,
    fetchLogs,
  };
}
