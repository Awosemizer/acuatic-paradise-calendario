import { useEffect } from 'react';
import { AppState } from 'react-native';
import { syncReminders, remindersSupported } from '@/src/lib/reminders';
import { useSettings } from '@/src/context/SettingsContext';

/** Keeps local reminders in sync on app start, foreground and settings changes. */
export function useReminders() {
  const { settings } = useSettings();
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
  }, [settings.reminders, settings.bitacoraAlerts, settings.reminderMinutes]);
}
