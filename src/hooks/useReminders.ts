import { useEffect } from 'react';
import { AppState } from 'react-native';
import { syncReminders, remindersSupported } from '@/src/lib/reminders';
import { useSetting } from '@/src/hooks/useLayoutMode';

/** Keeps local reminders in sync on app start, foreground and settings changes. */
export function useReminders() {
  const reminders = useSetting('reminders');
  const bitacoraAlerts = useSetting('bitacoraAlerts');
  const reminderMinutes = useSetting('reminderMinutes');
  useEffect(() => {
    if (!remindersSupported) return;
    const t = setTimeout(() => void syncReminders(), 1500);
    const sub = AppState.addEventListener('change', (st) => {
      if (st === 'active') void syncReminders();
    });
    return () => {
      clearTimeout(t);
      sub.remove();
    };
  }, [reminders, bitacoraAlerts, reminderMinutes]);
}
