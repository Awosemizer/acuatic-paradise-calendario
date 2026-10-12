import { useSyncExternalStore } from 'react';
import { useWindowDimensions } from 'react-native';
import { getSettings, subscribeSettings, type AppSettings } from '@/src/lib/settingsStore';

export const TABLET_MIN_WIDTH = 600;

/** Subscribe to a single setting; only re-renders when that value changes. */
export function useSetting<K extends keyof AppSettings>(key: K): AppSettings[K] {
  return useSyncExternalStore(
    subscribeSettings,
    () => getSettings()[key],
    () => getSettings()[key],
  );
}

/**
 * Tablet layout switch. Automático = window width >= 600dp (updates live on rotation / resize),
 * Siempre / Nunca force it. A Galaxy A35 in portrait (~411dp) stays on the phone layout.
 */
export function useIsTablet() {
  const { width } = useWindowDimensions();
  const mode = useSetting('tabletMode');
  if (mode === 'always') return width >= 480;
  if (mode === 'never') return false;
  return width >= TABLET_MIN_WIDTH;
}

export function useLayout() {
  const { width, height } = useWindowDimensions();
  const tablet = useIsTablet();
  return { tablet, width, height, landscape: width > height, wide: tablet && width >= 1000 };
}
