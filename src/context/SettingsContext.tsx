import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  getSettings,
  getStyleVersion,
  loadSettings,
  saveSettings,
  subscribeSettings,
  type AppSettings,
} from '@/src/lib/settingsStore';

type Ctx = {
  settings: AppSettings;
  ready: boolean;
  /** Changes key whenever appearance changes, used to remount the UI. */
  styleKey: number;
  update: (patch: Partial<AppSettings>) => Promise<void>;
};

const SettingsCtx = createContext<Ctx | null>(null);

/** Set before an appearance remount so the app reopens Ajustes afterwards. */
export const settingsNav = { returnToSettings: false };

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(getSettings());
  const [ready, setReady] = useState(false);
  const [styleKey, setStyleKey] = useState(getStyleVersion());

  useEffect(() => {
    let alive = true;
    loadSettings().then((s) => {
      if (!alive) return;
      setSettings(s);
      setStyleKey(getStyleVersion());
      setReady(true);
    });
    const unsub = subscribeSettings(() => setSettings(getSettings()));
    return () => {
      alive = false;
      unsub();
    };
  }, []);

  const update = useCallback(async (patch: Partial<AppSettings>) => {
    const prev = getSettings();
    const visual =
      (patch.fontSize && patch.fontSize !== prev.fontSize) ||
      (patch.accent && patch.accent !== prev.accent);
    await saveSettings(patch);
    if (visual) {
      settingsNav.returnToSettings = true;
      setStyleKey(getStyleVersion());
    }
  }, []);

  return (
    <SettingsCtx.Provider value={{ settings, ready, styleKey, update }}>{children}</SettingsCtx.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsCtx);
  if (!ctx) throw new Error('useSettings fuera de SettingsProvider');
  return ctx;
}
