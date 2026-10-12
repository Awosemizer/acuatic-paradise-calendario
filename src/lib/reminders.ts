import { Platform } from 'react-native';
import { addDays } from 'date-fns';
import { supabase } from '@/src/lib/supabase';
import { formatTime } from '@/src/lib/dates';
import { getSettings } from '@/src/lib/settingsStore';
import { bitacoraStatus } from '@/src/hooks/useBitacora';
import type { BitacoraItem, CalendarEvent, Visit } from '@/src/types';

type NotificationsModule = typeof import('expo-notifications');
let mod: NotificationsModule | null = null;
function N(): NotificationsModule | null {
  if (Platform.OS === 'web') return null;
  if (!mod) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      mod = require('expo-notifications') as NotificationsModule;
      mod.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowBanner: true,
          shouldShowList: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
        }),
      });
    } catch {
      mod = null;
    }
  }
  return mod;
}

export const remindersSupported = Platform.OS !== 'web';

export async function ensureNotificationPermission(): Promise<boolean> {
  const n = N();
  if (!n) return false;
  if (Platform.OS === 'android') {
    await n.setNotificationChannelAsync('recordatorios', {
      name: 'Recordatorios',
      importance: n.AndroidImportance.HIGH,
      vibrationPattern: [0, 200, 120, 200],
      lightColor: '#14C4C8',
    });
  }
  const current = await n.getPermissionsAsync();
  if (current.granted) return true;
  const req = await n.requestPermissionsAsync();
  return req.granted;
}

let running = false;

/** Re-schedules all local reminders (next 7 days + daily bitácora check). */
export async function syncReminders() {
  const n = N();
  if (!n || running) return;
  running = true;
  try {
    const s = getSettings();
    await n.cancelAllScheduledNotificationsAsync();
    if (!s.reminders && !s.bitacoraAlerts) return;
    const ok = await ensureNotificationPermission();
    if (!ok) return;
    const now = new Date();
    const channelId = 'recordatorios';

    if (s.reminders) {
      const to = addDays(now, 7).toISOString();
      const [v, e] = await Promise.all([
        supabase.from('visits').select('*').gte('starts_at', now.toISOString()).lte('starts_at', to).eq('status', 'programada'),
        supabase.from('events').select('*').gte('starts_at', now.toISOString()).lte('starts_at', to),
      ]);
      const items: { title: string; body: string; at: Date }[] = [];
      for (const visit of (v.data as Visit[]) ?? []) {
        const start = new Date(visit.starts_at);
        items.push({
          title: `Visita: ${visit.client_name}`,
          body: `${visit.service_type} · ${formatTime(start)}`,
          at: new Date(start.getTime() - s.reminderMinutes * 60_000),
        });
      }
      for (const ev of (e.data as CalendarEvent[]) ?? []) {
        const start = new Date(ev.starts_at);
        items.push({
          title: `Evento: ${ev.title}`,
          body: `Empieza a las ${formatTime(start)}`,
          at: new Date(start.getTime() - s.reminderMinutes * 60_000),
        });
      }
      for (const it of items.filter((x) => x.at > now).slice(0, 50)) {
        await n.scheduleNotificationAsync({
          content: { title: it.title, body: it.body },
          trigger: { type: n.SchedulableTriggerInputTypes.DATE, date: it.at, channelId },
        });
      }
    }

    if (s.bitacoraAlerts) {
      const { data } = await supabase.from('bitacora_items').select('*').eq('active', true);
      const overdue = ((data as BitacoraItem[]) ?? []).filter((i) => bitacoraStatus(i) === 'vencido').length;
      const soon = ((data as BitacoraItem[]) ?? []).filter((i) => bitacoraStatus(i) === 'pronto').length;
      if (overdue || soon) {
        await n.scheduleNotificationAsync({
          content: {
            title: 'Bitácora de mantenimiento',
            body: [overdue ? `${overdue} vencido${overdue === 1 ? '' : 's'}` : '', soon ? `${soon} pronto` : '']
              .filter(Boolean)
              .join(' · '),
          },
          trigger: { type: n.SchedulableTriggerInputTypes.DAILY, hour: 8, minute: 0, channelId },
        });
      }
    }
  } catch (err) {
    console.warn('No se pudieron programar recordatorios', err);
  } finally {
    running = false;
  }
}
